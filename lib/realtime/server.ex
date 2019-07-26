defmodule Realtime.Server do
  @moduledoc """
  Fetches live data from RTR, and forwards it to connected clients.

  Uses a global regsitry, with the server's pid as the key.
  Each subscriber's route_id is stored as the value of their registry entries.
  """

  use GenServer

  alias Gtfs.Route
  alias Realtime.Vehicles
  require Logger

  @typep state :: Route.by_id(Vehicles.for_route())

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
  @spec subscribe(Route.id(), GenServer.server()) :: Vehicles.for_route()
  def subscribe(route_id, server \\ nil) do
    server = server || default_name()
    {registry_key, vehicles_for_route} = GenServer.call(server, {:subscribe, route_id})
    Registry.register(Realtime.Registry, registry_key, route_id)
    vehicles_for_route
  end

  @spec update_vehicles(Route.by_id(Vehicles.for_route())) :: term()
  def update_vehicles(vehicles_by_route_id, server \\ __MODULE__) do
    GenServer.cast(server, {:update_vehicles, vehicles_by_route_id})
  end

  # GenServer callbacks

  @impl true
  def init(_opts) do
    {:ok, %{}}
  end

  # If we get a reply after we've already timed out, ignore it
  @impl true
  def handle_info({reference, _}, state) when is_reference(reference), do: {:noreply, state}

  @impl true
  def handle_call({:subscribe, route_id}, _from, state) do
    registry_key = self()
    vehicles_for_route = Map.get(state, route_id, Vehicles.empty_vehicles_for_route())
    {:reply, {registry_key, vehicles_for_route}, state}
  end

  @impl true
  def handle_cast({:update_vehicles, vehicles_by_route_id}, _state) do
    broadcast(vehicles_by_route_id)
    new_state = vehicles_by_route_id
    {:noreply, new_state}
  end

  @spec broadcast(state()) :: :ok
  defp broadcast(vehicles_by_route_id) do
    registry_key = self()

    Registry.dispatch(registry_name(), registry_key, fn entries ->
      for {pid, route_id} <- entries do
        vehicles_for_route =
          Map.get(
            vehicles_by_route_id,
            route_id,
            Vehicles.empty_vehicles_for_route()
          )

        send(pid, {:new_realtime_data, vehicles_for_route})
      end
    end)
  end
end
