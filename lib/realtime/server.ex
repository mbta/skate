defmodule Realtime.Server do
  @moduledoc """
  Fetches live data from RTR, and forwards it to connected clients.

  Uses a global regsitry, with the server's pid as the key.
  Each subscriber's route_id is stored as the value of their registry entries.
  """

  use GenServer

  alias Concentrate.StopTimeUpdate
  alias Gtfs.{Route, Trip}

  alias Realtime.{
    Vehicle,
    VehicleOrGhost
  }

  require Logger

  @enforce_keys [:ets]

  defstruct ets: nil,
            active_route_ids: []

  @type subscription_key ::
          {:route_id, Route.id()} | :all_shuttles | :all_vehicles | {:search, search_params()}

  @type search_params :: %{
          text: String.t(),
          property: search_property()
        }

  @type search_property :: :all | :run | :vehicle | :operator

  @type lookup_key :: {:ets.tid(), subscription_key}

  @type broadcast_message :: {:new_realtime_data, lookup_key}

  @typep t :: %__MODULE__{
           ets: :ets.tid(),
           active_route_ids: [Route.id()]
         }

  # Client functions

  @spec default_name() :: GenServer.name()
  def default_name(), do: Realtime.Server

  @spec start_link(Keyword.t()) :: GenServer.on_start()
  def start_link(start_link_opts) do
    GenServer.start_link(__MODULE__, [], start_link_opts)
  end

  @doc """
  The subscribing process will get a message when there's new data, with the form
  {:new_realtime_data, lookup_args}
  Those lookup_args can be passed into Server.lookup(lookup_args) to get the data.
  """
  @spec subscribe_to_route(Route.id(), GenServer.server()) :: [VehicleOrGhost.t()]
  def subscribe_to_route(route_id, server \\ default_name()) do
    subscribe(server, {:route_id, route_id})
  end

  @spec subscribe_to_all_shuttles(GenServer.server()) :: [Vehicle.t()]
  def subscribe_to_all_shuttles(server \\ default_name()) do
    subscribe(server, :all_shuttles)
  end

  @spec subscribe_to_search(String.t(), atom(), GenServer.server()) :: [VehicleOrGhost.t()]
  def subscribe_to_search(text, property, server \\ default_name()) do
    subscribe(
      server,
      {:search,
       %{
         text: text,
         property: property
       }}
    )
  end

  @spec subscribe(GenServer.server(), {:route_id, Route.id()}) :: [VehicleOrGhost.t()]
  @spec subscribe(GenServer.server(), :all_shuttles) :: [Vehicle.t()]
  @spec subscribe(GenServer.server(), {:search, search_params()}) :: [VehicleOrGhost.t()]
  defp subscribe(server, subscription_key) do
    {registry_key, ets} = GenServer.call(server, :subscription_info)
    Registry.register(Realtime.Registry, registry_key, subscription_key)
    lookup({ets, subscription_key})
  end

  @spec update({Route.by_id([VehicleOrGhost.t()]), [Vehicle.t()]}) :: term()
  @spec update(
          {Route.by_id([VehicleOrGhost.t()]), [Vehicle.t()]},
          GenServer.server()
        ) :: term()
  def update(update_term, server \\ __MODULE__)

  def update({vehicles_by_route_id, shuttles}, server) do
    GenServer.cast(server, {:update, vehicles_by_route_id, shuttles})
  end

  @spec lookup({:ets.tid(), {:route_id, Route.id()}}) :: [VehicleOrGhost.t()]
  @spec lookup({:ets.tid(), :all_vehicles}) :: [VehicleOrGhost.t()]
  @spec lookup({:ets.tid(), :all_shuttles}) :: [Vehicle.t()]
  @spec lookup({:ets.tid(), {:search, search_params()}}) :: [VehicleOrGhost.t()]
  @spec lookup({:ets.tid(), {:trip_id, Trip.id()}}) :: [StopTimeUpdate.t()]
  def lookup({table, {:search, search_params}}) do
    {table, :all_vehicles}
    |> lookup()
    |> VehicleOrGhost.find_by(search_params)
  end

  def lookup({table, key}) do
    :ets.lookup_element(table, key, 2)
  rescue
    # :ets.lookup_element/3 exits with :badarg when key is not found
    ArgumentError ->
      []
  end

  # GenServer callbacks

  @impl true
  def init(_opts) do
    ets = :ets.new(__MODULE__, [:set, :protected, {:read_concurrency, true}])

    {:ok, %__MODULE__{ets: ets}}
  end

  # If we get a reply after we've already timed out, ignore it
  @impl true
  def handle_info({reference, _}, %__MODULE__{} = state) when is_reference(reference),
    do: {:noreply, state}

  @impl true
  def handle_call(:subscription_info, _from, %__MODULE__{} = state) do
    registry_key = self()
    {:reply, {registry_key, state.ets}, state}
  end

  def handle_call(:ets, _from, %__MODULE__{ets: ets} = state) do
    # used only by tests
    {:reply, ets, state}
  end

  @impl true
  def handle_cast(
        {:update, vehicles_by_route_id, shuttles},
        %__MODULE__{} = state
      ) do
    new_active_route_ids = Map.keys(vehicles_by_route_id)

    _ = update_vehicle_positions(state, vehicles_by_route_id, shuttles, new_active_route_ids)

    new_state = Map.put(state, :active_route_ids, new_active_route_ids)
    _ = broadcast(new_state)

    {:noreply, new_state}
  end

  defp update_vehicle_positions(
         %__MODULE__{ets: ets, active_route_ids: active_route_ids},
         vehicles_by_route_id,
         shuttles,
         new_active_route_ids
       ) do
    removed_route_ids = active_route_ids -- new_active_route_ids

    for route_id <- removed_route_ids do
      _ = :ets.delete(ets, {:route_id, route_id})
    end

    for {route_id, vehicles_and_ghosts} <- vehicles_by_route_id do
      _ = :ets.insert(ets, {{:route_id, route_id}, vehicles_and_ghosts})
    end

    :ets.insert(ets, {:all_vehicles, Enum.uniq(all_vehicles(vehicles_by_route_id) ++ shuttles)})

    :ets.insert(ets, {:all_shuttles, shuttles})
  end

  @spec all_vehicles(Route.by_id([VehicleOrGhost.t()])) :: [VehicleOrGhost.t()]
  defp all_vehicles(vehicles_by_route_id) do
    Enum.flat_map(
      vehicles_by_route_id,
      fn {route_id, vehicles_and_ghosts} ->
        Enum.filter(vehicles_and_ghosts, fn vehicle_or_ghost ->
          vehicle_or_ghost.route_id == route_id
        end)
      end
    )
  end

  @spec broadcast(t()) :: :ok
  defp broadcast(state) do
    registry_key = self()

    Registry.dispatch(Realtime.Supervisor.registry_name(), registry_key, fn entries ->
      Enum.each(entries, &send_data(&1, state))
    end)
  end

  @spec send_data({pid, subscription_key}, t) :: broadcast_message
  defp send_data({pid, subscription_key}, state) do
    send(pid, {:new_realtime_data, {state.ets, subscription_key}})
  end
end
