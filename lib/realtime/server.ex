defmodule Realtime.Server do
  @moduledoc """
  Fetches live data from RTR, and forwards it to connected clients.

  Uses a global regsitry, with the server's pid as the key.
  Each subscriber's route_id is stored as the value of their registry entries.
  """

  use GenServer

  alias Gtfs.Route
  require Logger

  @type vehicles_by_route_id :: %{optional(Route.id()) => [Realtime.Vehicle.t()]}

  @type state :: %{
          vehicles: vehicles_by_route_id()
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
  {:new_realtime_data, vehicles_by_route_id()}
  """
  @spec subscribe(Route.id(), GenServer.server()) :: vehicles_by_route_id()
  def subscribe(route_id, server \\ nil) do
    server = server || default_name()
    {registry_key, vehicles} = GenServer.call(server, {:subscribe, route_id})
    Registry.register(Realtime.Registry, registry_key, route_id)
    vehicles
  end

  @spec update_vehicles(vehicles_by_route_id()) :: term()
  def update_vehicles(vehicles, server \\ __MODULE__) do
    GenServer.cast(server, {:update_vehicles, vehicles})
  end

  # GenServer callbacks

  @impl true
  def init(_opts) do
    initial_state = %{
      vehicles: Map.new()
    }

    {:ok, initial_state}
  end

  # If we get a reply after we've already timed out, ignore it
  @impl true
  def handle_info({reference, _}, state) when is_reference(reference), do: {:noreply, state}

  @impl true
  def handle_call({:subscribe, route_id}, _from, state) do
    registry_key = self()
    vehicles = Map.get(state.vehicles, route_id, [])
    {:reply, {registry_key, vehicles}, state}
  end

  @impl true
  def handle_cast({:update_vehicles, vehicles}, state) do
    broadcast(vehicles)
    new_state = %{state | vehicles: vehicles}
    {:noreply, new_state}
  end

  @spec broadcast(vehicles_by_route_id()) :: :ok
  defp broadcast(vehicles) do
    registry_key = self()

    Registry.dispatch(registry_name(), registry_key, fn entries ->
      for {pid, route_id} <- entries do
        send(pid, {:new_realtime_data, Map.get(vehicles, route_id, [])})
      end
    end)
  end
end
