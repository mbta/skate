defmodule Concentrate.Consumer.StopTimeUpdates do
  @moduledoc """
  Consumes output from Merge and reports stop time updates to the realtime server.
  """

  use GenStage

  alias Concentrate.{StopTimeUpdate, TripUpdate}
  alias Gtfs.Trip
  alias Realtime.StopTimeUpdateStore

  @type stop_time_updates_by_trip :: %{Trip.id() => [StopTimeUpdate.t()]}

  def start_link(opts) do
    GenStage.start_link(__MODULE__, opts)
  end

  @impl GenStage
  def init(opts) do
    {:consumer, :the_state_does_not_matter, opts}
  end

  # If we get a reply after we've already timed out, ignore it
  @impl GenStage
  def handle_info({reference, _}, state) when is_reference(reference),
    do: {:noreply, [], state}

  @impl GenStage
  def handle_events(events, _from, state) do
    all_updates = List.last(events)

    :ok =
      all_updates
      |> stop_time_updates_by_trip()
      |> StopTimeUpdateStore.set()

    {:noreply, [], state}
  end

  @spec stop_time_updates_by_trip([TripUpdate.t() | StopTimeUpdate.t()]) ::
          stop_time_updates_by_trip()
  def stop_time_updates_by_trip(all_updates) do
    all_updates
    |> Enum.filter(&match?(%StopTimeUpdate{}, &1))
    |> Enum.group_by(& &1.trip_id)
  end
end
