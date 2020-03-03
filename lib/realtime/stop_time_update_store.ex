defmodule Realtime.StopTimeUpdateStore do
  @moduledoc """
  Server for setting and getting StopTimeUpdates.
  """

  use GenServer

  alias Concentrate.Consumer.StopTimeUpdates
  alias Concentrate.StopTimeUpdate
  alias Gtfs.Trip

  @type t :: %__MODULE__{
          stop_time_updates_by_trip: StopTimeUpdates.stop_time_updates_by_trip()
        }

  defstruct stop_time_updates_by_trip: %{}

  # Client

  @spec default_name() :: GenServer.name()
  def default_name(), do: Realtime.StopTimeUpdateStore

  @spec start_link() :: GenServer.on_start()
  @spec start_link(Keyword.t()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, nil, name: Keyword.get(opts, :name, default_name()))
  end

  @spec stop_time_updates_for_trip(Trip.id()) :: [StopTimeUpdate.t()]
  @spec stop_time_updates_for_trip(Trip.id(), GenServer.server()) :: [StopTimeUpdate.t()]
  def stop_time_updates_for_trip(trip_id, server \\ default_name()) do
    GenServer.call(server, {:stop_time_updates_for_trip, trip_id})
  end

  @spec set(StopTimeUpdates.stop_time_updates_by_trip()) :: :ok
  @spec set(StopTimeUpdates.stop_time_updates_by_trip(), GenServer.server()) :: :ok
  def set(stop_time_updates_by_trip, server \\ default_name()) do
    GenServer.cast(server, {:set, stop_time_updates_by_trip})
  end

  # Server

  @impl GenServer
  def init(_) do
    {:ok, %__MODULE__{}}
  end

  @impl true
  def handle_call(
        {:stop_time_updates_for_trip, trip_id},
        _from,
        %__MODULE__{stop_time_updates_by_trip: stop_time_updates_by_trip} = state
      ) do
    stop_time_updates = Map.get(stop_time_updates_by_trip, trip_id, [])

    {:reply, stop_time_updates, state}
  end

  @impl true
  def handle_cast(
        {:set, stop_time_updates_by_trip},
        %__MODULE__{} = state
      ) do
    {:noreply, Map.put(state, :stop_time_updates_by_trip, stop_time_updates_by_trip)}
  end
end
