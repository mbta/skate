defmodule Concentrate.Consumer.StopTimeUpdates do
  @moduledoc """
  Consumes output from Merge and reports stop time updates to the realtime server.
  """

  use GenStage

  alias Concentrate.{StopTimeUpdate, TripUpdate}
  alias Gtfs.{Block, Trip}
  alias Realtime.{BlockWaiver, BlockWaiverStore, StopTimeUpdatesByTrip}

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

    stop_time_updates_by_trip = stop_time_updates_by_trip(all_updates)

    :ok =
      stop_time_updates_by_trip
      |> StopTimeUpdatesByTrip.trip_ids()
      |> block_and_service_ids()
      |> block_waivers_by_block_and_service_ids(stop_time_updates_by_trip)
      |> BlockWaiverStore.set()

    {:noreply, [], state}
  end

  @spec stop_time_updates_by_trip([TripUpdate.t() | StopTimeUpdate.t()]) ::
          StopTimeUpdatesByTrip.t()
  def stop_time_updates_by_trip(all_updates) do
    all_updates
    |> Enum.filter(&match?(%StopTimeUpdate{}, &1))
    |> Enum.group_by(& &1.trip_id)
  end

  @type block_and_service_ids_set :: MapSet.t(Block.key())
  @spec block_and_service_ids([Trip.id()]) :: block_and_service_ids_set()
  defp block_and_service_ids(trip_ids) do
    Enum.reduce(trip_ids, MapSet.new(), fn trip_id, acc ->
      trip_fn = Application.get_env(:realtime, :trip_fn, &Gtfs.trip/1)
      trip = trip_fn.(trip_id)

      MapSet.put(acc, {trip.block_id, trip.service_id})
    end)
  end

  @spec block_waivers_by_block_and_service_ids(
          block_and_service_ids_set(),
          StopTimeUpdatesByTrip.t()
        ) :: BlockWaiverStore.block_waivers_by_block_and_service_ids()
  defp block_waivers_by_block_and_service_ids(
         block_and_service_ids_set,
         stop_time_updates_by_trip
       ) do
    block_and_service_ids_set
    |> Enum.map(&block_waivers_for_block_id_and_service_id(&1, stop_time_updates_by_trip))
    |> Enum.filter(&has_block_waivers?/1)
    |> Map.new()
  end

  @spec block_waivers_for_block_id_and_service_id(
          Block.key(),
          StopTimeUpdatesByTrip.t()
        ) ::
          {Block.key(), [BlockWaiver.t()]}
  defp block_waivers_for_block_id_and_service_id(
         {block_id, service_id},
         stop_time_updates_by_trip
       ) do
    block_fn = Application.get_env(:realtime, :block_fn, &Gtfs.block/2)
    block = block_fn.(block_id, service_id)

    block_waivers = BlockWaiver.block_waivers_for_block(block, stop_time_updates_by_trip)

    {{block_id, service_id}, block_waivers}
  end

  @spec has_block_waivers?({Block.key(), [BlockWaiver.t()]}) :: boolean
  defp has_block_waivers?({_, []}), do: false
  defp has_block_waivers?({_, _}), do: true
end
