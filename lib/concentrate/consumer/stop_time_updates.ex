defmodule Concentrate.Consumer.StopTimeUpdates do
  @moduledoc """
  Consumes output from Merge and reports stop time updates to the realtime server.
  """

  use GenStage

  alias Concentrate.{StopTimeUpdate, TripUpdate}
  alias Schedule.{Block, Trip}
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
      |> block_keys()
      |> block_waivers_by_block_key(stop_time_updates_by_trip)
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

  @type block_keys_set :: MapSet.t(Block.key())
  @spec block_keys([Trip.id()]) :: block_keys_set()
  defp block_keys(trip_ids) do
    Enum.reduce(trip_ids, MapSet.new(), fn trip_id, acc ->
      trip_fn = Application.get_env(:realtime, :trip_fn, &Schedule.trip/1)
      trip = trip_fn.(trip_id)

      if trip != nil and trip.schedule_id != nil do
        MapSet.put(acc, {trip.schedule_id, trip.block_id})
      else
        acc
      end
    end)
  end

  @spec block_waivers_by_block_key(
          block_keys_set(),
          StopTimeUpdatesByTrip.t()
        ) :: BlockWaiver.block_waivers_by_block_key()
  defp block_waivers_by_block_key(
         block_keys_set,
         stop_time_updates_by_trip
       ) do
    block_keys_set
    |> Enum.map(&block_waivers_for_schedule_id_and_block_id(&1, stop_time_updates_by_trip))
    |> Enum.filter(&has_block_waivers?/1)
    |> Map.new()
  end

  @spec block_waivers_for_schedule_id_and_block_id(
          Block.key(),
          StopTimeUpdatesByTrip.t()
        ) ::
          {Block.key(), [BlockWaiver.t()]}
  defp block_waivers_for_schedule_id_and_block_id(
         {schedule_id, block_id} = block_key,
         stop_time_updates_by_trip
       ) do
    block_fn = Application.get_env(:realtime, :block_fn, &Schedule.block/2)
    block = block_fn.(schedule_id, block_id)

    block_waivers = BlockWaiver.block_waivers_for_block(block, stop_time_updates_by_trip)

    {block_key, block_waivers}
  end

  @spec has_block_waivers?({Block.key(), [BlockWaiver.t()]}) :: boolean
  defp has_block_waivers?({_, []}), do: false
  defp has_block_waivers?({_, _}), do: true
end
