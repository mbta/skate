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

  defstruct by_route_id: %{}, shuttles: [], ets: nil

  @type broadcast_data :: {:vehicles_for_route, Vehicles.for_route()} | {:shuttles, [Vehicle.t()]}

  @typep subscription_key :: {:route_id, Route.id()} | :all_shuttles

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

  # GenServer callbacks

  @impl true
  def init(_opts) do
    ets = :ets.new(__MODULE__, [])

    {:ok, %__MODULE__{ets: ets}}
  end

  # If we get a reply after we've already timed out, ignore it
  @impl true
  def handle_info({reference, _}, %__MODULE__{} = state) when is_reference(reference),
    do: {:noreply, state}

  @impl true
  def handle_call({:subscribe, subscription_key}, _from, %__MODULE__{} = state) do
    registry_key = self()

    {_, data} = data_to_send(state, subscription_key)
    {:reply, {registry_key, data}, state}
  end

  @impl true
  def handle_cast({:update, by_route_id, shuttles}, %__MODULE__{} = state) do
    _ = update_ets(state, by_route_id, shuttles)
    _ = broadcast(state)
    {:noreply, state}
  end

  defp update_ets(%__MODULE__{ets: ets}, by_route_id, shuttles) do
    _ = :ets.delete_all_objects(ets)

    records =
      []
      |> by_route_id_to_records(by_route_id)
      |> shuttles_to_records(shuttles)

    :ets.insert(ets, records)
  end

  defp by_route_id_to_records(records, by_route_id) do
    Enum.reduce(by_route_id, records, fn {route_id, vehicles}, acc ->
      [{route_id, false, vehicles} | acc]
    end)
  end

  defp shuttles_to_records(records, shuttles) do
    [{nil, true, shuttles} | records]
  end

  @spec broadcast(t()) :: :ok
  defp broadcast(state) do
    registry_key = self()

    Registry.dispatch(registry_name(), registry_key, fn entries ->
      Enum.each(entries, &send_data(&1, state))
    end)
  end

  @spec send_data({pid, subscription_key}, t) :: {:new_realtime_data, broadcast_data}
  defp send_data({pid, subscription_key}, state) do
    send(pid, {:new_realtime_data, data_to_send(state, subscription_key)})
  end

  @spec data_to_send(t, subscription_key) :: broadcast_data
  defp data_to_send(%__MODULE__{ets: ets}, {:route_id, route_id}) do
    data = fetch_data_from_ets(ets, {:route_id, route_id})
    {:vehicles_for_route, data}
  end

  defp data_to_send(%__MODULE__{ets: ets}, :all_shuttles) do
    data = fetch_data_from_ets(ets, :all_shuttles)
    {:shuttles, data}
  end

  defp fetch_data_from_ets(ets, subscription_key) do
    ets
    |> :ets.select([{ets_match_pattern(subscription_key), [], [:"$1"]}])
    |> case do
      [match] -> match
      [] -> default_data(subscription_key)
    end
  end

  defp ets_match_pattern({:route_id, route_id}) do
    {route_id, :_, :"$1"}
  end

  defp ets_match_pattern(:all_shuttles) do
    {:_, true, :"$1"}
  end

  defp default_data({:route_id, _}) do
    Vehicles.empty_vehicles_for_route()
  end

  defp default_data(:all_shuttles) do
    []
  end
end
