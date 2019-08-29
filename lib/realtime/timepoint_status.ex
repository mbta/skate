defmodule Realtime.TimepointStatus do
  alias Gtfs.Block
  alias Gtfs.Direction
  alias Gtfs.Stop
  alias Gtfs.StopTime
  alias Gtfs.Route
  alias Gtfs.Trip

  @typedoc """
  fraction_until_timepoint ranges
    from 0.0 (inclusive) if the vehicle is at the given timepoint
    to 1.0 (exclusive) if the vehicle has just left the previous timepoint
  """
  @type timepoint_status ::
          %{
            timepoint_id: StopTime.timepoint_id(),
            fraction_until_timepoint: float()
          }
  @type scheduled_location ::
          %{
            route_id: Route.id(),
            direction_id: Direction.id(),
            timepoint_status: timepoint_status()
          }

  @spec timepoint_status([StopTime.t()], Stop.id()) :: timepoint_status() | nil
  def timepoint_status(stop_times, stop_id) do
    {past_stop_times, future_stop_times} = Enum.split_while(stop_times, &(&1.stop_id != stop_id))

    case Enum.find(future_stop_times, &StopTime.is_timepoint?(&1)) do
      %StopTime{timepoint_id: next_timepoint_id} ->
        # past_count needs +1 for the step between the current timepoint and the first of the past stops
        past_count = count_to_timepoint(Enum.reverse(past_stop_times)) + 1
        future_count = count_to_timepoint(future_stop_times)

        %{
          timepoint_id: next_timepoint_id,
          fraction_until_timepoint: future_count / (future_count + past_count)
        }

      nil ->
        nil
    end
  end

  @doc """
  If a block isn't scheduled to have started yet:
    the start of the first trip
  If a block is scheduled to have finished:
    the end of the last trip
  If now is in the middle of a layover:
    the end of the previous trip
  If now is in the middle of a trip:
    the next timepoint in that trip
  """
  @spec scheduled_location(Block.t() | nil, Util.Time.timestamp()) :: scheduled_location() | nil
  def scheduled_location(nil, _now) do
    nil
  end

  def scheduled_location([], _now) do
    nil
  end

  def scheduled_location(block, now) do
    now_time_of_day =
      Util.Time.next_time_of_day_for_timestamp_after(
        now,
        # Allow a little wiggle room in case a bus appears just before its block starts
        Util.Time.time_of_day_add_minutes(Block.start_time(block), -60)
      )

    trip = scheduled_trip_on_block(block, now_time_of_day)
    timepoints = Enum.filter(trip.stop_times, &StopTime.is_timepoint?/1)

    case timepoints do
      [] ->
        nil

      _ ->
        timepoint_status = scheduled_timepoint_status(timepoints, now_time_of_day)

        %{
          route_id: trip.route_id,
          direction_id: trip.direction_id,
          timepoint_status: timepoint_status
        }
    end
  end

  @spec scheduled_trip_on_block(Block.t(), Util.Time.time_of_day()) :: Trip.t()
  defp scheduled_trip_on_block(block, now) do
    cond do
      now <= Block.start_time(block) ->
        # Block isn't scheduled to have started yet
        List.first(block)

      now >= Block.end_time(block) ->
        # Block is scheduled to have finished
        List.last(block)

      true ->
        # Either the current trip or the trip that just ended (the last trip to have started)
        block
        |> Enum.take_while(fn trip ->
          Trip.start_time(trip) <= now
        end)
        |> List.last()
    end
  end

  @spec scheduled_timepoint_status([StopTime.t()], Util.Time.time_of_day()) :: timepoint_status()
  def scheduled_timepoint_status(timepoints, now) do
    cond do
      now <= List.first(timepoints).time ->
        # Trip isn't scheduled to have started yet
        %{
          timepoint_id: List.first(timepoints).timepoint_id,
          fraction_until_timepoint: 0
        }

      now >= List.last(timepoints).time ->
        # Trip is scheduled to have finished
        %{
          timepoint_id: List.last(timepoints).timepoint_id,
          fraction_until_timepoint: 0
        }

      true ->
        # Trip is scheduled to be between two timepoints
        {previous_timepoint, next_timepoint} =
          Realtime.Helpers.find_and_previous(timepoints, fn timepoint ->
            timepoint.time > now
          end)

        %{
          timepoint_id: next_timepoint.timepoint_id,
          fraction_until_timepoint:
            (next_timepoint.time - now) /
              (next_timepoint.time - previous_timepoint.time)
        }
    end
  end

  @spec count_to_timepoint([StopTime.t()]) :: non_neg_integer()
  defp count_to_timepoint(stop_times) do
    count = Enum.find_index(stop_times, &StopTime.is_timepoint?(&1))

    if is_number(count), do: count, else: length(stop_times)
  end
end
