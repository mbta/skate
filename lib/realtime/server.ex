defmodule Realtime.Server do
  @moduledoc """
  Fetches live data from RTR, and forwards it to connected clients.

  Uses a global regsitry, with the server's pid as the key.
  Each subscriber's route_id is stored as the value of their registry entries.
  """

  use GenServer

  alias Gtfs.Route

  alias Realtime.{
    Vehicle,
    Vehicles
  }

  require Logger

  @enforce_keys [:ets]

  defstruct ets: nil

  @type subscription_key :: {:route_id, Route.id()} | :all_shuttles

  @type data_category :: :vehicles | :shuttles

  @type lookup_key :: {:ets.tid(), subscription_key}

  @type broadcast_message :: {:new_realtime_data, data_category, lookup_key}

  @typep t :: %__MODULE__{
           ets: :ets.tid()
         }

  # Client functions

  @spec registry_name() :: Registry.registry()
  def registry_name(), do: Realtime.Registry

  @spec default_name() :: GenServer.name()
  def default_name(), do: Realtime.Server

  @spec start_link(Keyword.t()) :: GenServer.on_start()
  def start_link(start_link_opts) do
    GenServer.start_link(__MODULE__, [], start_link_opts)
  end

  @doc """
  The subscribing process will get a message when there's new data, with the form
  {:new_realtime_data, vehicles_on_route()}
  """
  @spec subscribe_to_route(Route.id(), GenServer.server()) :: Vehicles.for_route()
  def subscribe_to_route(route_id, server \\ default_name()) do
    subscribe(server, {:route_id, route_id})
  end

  @spec subscribe_to_all_shuttles(GenServer.server()) :: [Vehicle.t()]
  def subscribe_to_all_shuttles(server \\ default_name()) do
    subscribe(server, :all_shuttles)
  end

  @spec subscribe(GenServer.server(), {:route_id, Route.id()}) :: Vehicles.for_route()
  @spec subscribe(GenServer.server(), :all_shuttles) :: [Vehicle.t()]
  defp subscribe(server, subscription_key) do
    {registry_key, data} = GenServer.call(server, {:subscribe, subscription_key})
    Registry.register(Realtime.Registry, registry_key, subscription_key)
    data
  end

  @spec update({Route.by_id(Vehicles.for_route()), [Vehicle.t()]}, GenServer.server()) :: term()
  def update({vehicles_by_route_id, shuttles}, server \\ __MODULE__) do
    GenServer.cast(server, {:update, vehicles_by_route_id, shuttles})
  end

  @spec lookup({:ets.tid(), {:route_id, Route.id()}}) :: Vehicles.for_route()
  @spec lookup({:ets.tid(), :all_shuttles}) :: [Vehicle.t()]
  def lookup({table, key}) do
    :ets.lookup_element(table, key, 2)
  rescue
    # :ets.lookup_element/3 exits with :badarg when key is not found
    ArgumentError ->
      default_data(key)
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
  def handle_call({:subscribe, subscription_key}, _from, %__MODULE__{} = state) do
    registry_key = self()

    data = lookup({state.ets, subscription_key})
    {:reply, {registry_key, data}, state}
  end

  def handle_call(:ets, _from, %__MODULE__{ets: ets} = state) do
    # used only by tests
    {:reply, ets, state}
  end

  @impl true
  def handle_cast({:update, vehicles_by_route_id, shuttles}, %__MODULE__{} = state) do
    _ = update_ets(state, vehicles_by_route_id, shuttles)
    _ = broadcast(state)
    {:noreply, state}
  end

  defp update_ets(%__MODULE__{ets: ets}, vehicles_by_route_id, shuttles) do
    _ = :ets.delete_all_objects(ets)

    for {route_id, vehicles} <- vehicles_by_route_id do
      _ = :ets.insert(ets, {{:route_id, route_id}, vehicles})
    end

    :ets.insert(ets, {:all_shuttles, shuttles})
  end

  @spec broadcast(t()) :: :ok
  defp broadcast(state) do
    registry_key = self()

    Registry.dispatch(registry_name(), registry_key, fn entries ->
      Enum.each(entries, &send_data(&1, state))
    end)
  end

  @spec send_data({pid, subscription_key}, t) :: broadcast_message
  defp send_data({pid, subscription_key}, state) do
    category =
      case subscription_key do
        {:route_id, _} -> :vehicles
        :all_shuttles -> :shuttles
      end

    send(pid, {:new_realtime_data, category, {state.ets, subscription_key}})
  end

  defp default_data({:route_id, _}) do
    Vehicles.empty_vehicles_for_route()
  end

  defp default_data(:all_shuttles) do
    []
  end
end
