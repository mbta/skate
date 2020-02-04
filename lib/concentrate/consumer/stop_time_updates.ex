defmodule Concentrate.Consumer.StopTimeUpdates do
  @moduledoc """
  Consumes output from Merge and reports stop time updates to the realtime server.
  """

  use GenStage

  alias Concentrate.{Merge, StopTimeUpdate}
  alias Gtfs.Trip
  alias Realtime.Server

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
    groups = List.last(events)

    stop_time_updates_by_trip = stop_time_updates_from_groups(groups)

    :ok = Server.update({:stop_time_updates, stop_time_updates_by_trip})

    {:noreply, [], state}
  end

  @spec stop_time_updates_from_groups([Merge.trip_group()]) :: stop_time_updates_by_trip()
  def stop_time_updates_from_groups(groups) do
    groups
    |> Enum.map(&stop_time_updates_from_group/1)
    |> Enum.filter(&(&1 != nil))
    |> Map.new()
  end

  @spec stop_time_updates_from_group(Merge.trip_group()) ::
          {Trip.id(), [StopTimeUpdate.t()]} | nil
  defp stop_time_updates_from_group({_trip_update, _vehicle_positions, nil}) do
    nil
  end

  defp stop_time_updates_from_group({_trip_update, _vehicle_positions, []}) do
    nil
  end

  defp stop_time_updates_from_group(
         {%Concentrate.TripUpdate{trip_id: trip_id}, _vehicle_positions, stop_time_updates}
       ) do
    {trip_id, stop_time_updates}
  end
end
