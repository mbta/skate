defmodule Realtime.TimepointStatus do
  alias Schedule.{Block, Route, Trip}
  alias Schedule.Gtfs.{Direction, RoutePattern, Stop, StopTime}
  alias Schedule.Hastus.Run

  @typep point :: {float(), float()}

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
            route_pattern_id: RoutePattern.id() | nil,
            direction_id: Direction.id(),
            trip_id: Trip.id() | nil,
            run_id: Run.id() | nil,
            time_since_trip_start_time: integer(),
            headsign: String.t() | nil,
            via_variant: RoutePattern.via_variant() | nil,
            timepoint_status: timepoint_status()
          }

  @spec timepoint_status([StopTime.t()], Stop.id(), point()) ::
          timepoint_status() | nil
  def timepoint_status(stop_times, stop_id, vehicle_latlon) do
    # future_stop_times starts with the stop that has stop_id
    {past_stop_times, future_stop_times} = Enum.split_while(stop_times, &(&1.stop_id != stop_id))

    case Enum.find(future_stop_times, &StopTime.is_timepoint?(&1)) do
      %StopTime{timepoint_id: next_timepoint_id} ->
        stops_until_timepoint = count_to_timepoint(future_stop_times)

        # +1 for the step between the most recent stop and the next stop
        stops_in_this_timepoint_segment =
          count_to_timepoint(Enum.reverse(past_stop_times)) + 1 + stops_until_timepoint

        previous_stop_time = List.last(past_stop_times)

        fraction_until_next_stop =
          1.0 -
            fraction_between_stops(
              vehicle_latlon,
              previous_stop_time && previous_stop_time.stop_id,
              stop_id
            )

        %{
          timepoint_id: next_timepoint_id,
          fraction_until_timepoint:
            (stops_until_timepoint + fraction_until_next_stop) / stops_in_this_timepoint_segment
        }

      nil ->
        nil
    end
  end

  @doc """
  How far a bus is between two stops.
  0.0 means the bus is still at the first stop.
  1.0 means it's at the second stop.
  0.5 means it's halfway between.
  If either stop is missing lat lon data, default to being at the second stop.

  Approximates the path between the stops as a straight line.
  If the bus is not directly between the two stops,
  measures from the closest point to the bus that is between the stops.
  """
  @spec fraction_between_stops(point(), Stop.id() | nil, Stop.id()) :: float()
  def fraction_between_stops(vehicle_latlon, start_id, finish_id) do
    start_latlon = stop_latlon(start_id)
    finish_latlon = stop_latlon(finish_id)

    if start_latlon && finish_latlon do
      # Treating the latlons as if they're cartesian coordinates works fine at this scale.
      # We don't need fancy great circle distance measurements around the globe
      # A degree of longitude is smaller than a degree of latitude,
      # but if the bus is directly between the stops, that has no effect at all
      # and if the bus is not on that straight line, it will have an acceptably small effect.
      vehicle_latlon
      |> fraction_between_points(start_latlon, finish_latlon)
      |> clamp(0.0, 1.0)
    else
      1.0
    end
  end

  @spec stop_latlon(Stop.id()) :: point() | nil
  defp stop_latlon(stop_id) do
    stop_fn = Application.get_env(:skate, :stop_fn, &Schedule.stop/1)
    stop = stop_id && stop_fn.(stop_id)

    if stop && stop.latitude && stop.longitude do
      {stop.latitude, stop.longitude}
    else
      nil
    end
  end

  # Projects the point onto the straight line between the start and finish
  @spec fraction_between_points(point(), point(), point()) ::
          float()
  defp fraction_between_points(
         {point_lat, point_lon},
         {start_lat, start_lon},
         {finish_lat, finish_lon}
       ) do
    start_to_finish = {finish_lat - start_lat, finish_lon - start_lon}
    start_to_point = {point_lat - start_lat, point_lon - start_lon}
    dot_product(start_to_point, start_to_finish) / dot_product(start_to_finish, start_to_finish)
  end

  @spec dot_product(point(), point()) :: float()
  defp dot_product({x1, y1}, {x2, y2}) do
    x1 * x2 + y1 * y2
  end

  @spec clamp(float(), float(), float()) :: float()
  defp clamp(f, min, max) do
    f
    |> min(max)
    |> max(min)
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

  def scheduled_location(block, now) do
    now_time_of_day =
      Util.Time.next_time_of_day_for_timestamp_after(
        now,
        # Allow a little wiggle room in case a bus appears just before its block starts
        Util.Time.time_of_day_add_minutes(block.start_time, -60)
      )

    trip = Block.trip_at_time(block, now_time_of_day)

    case trip do
      nil ->
        nil

      _ ->
        timepoints = Enum.filter(trip.stop_times, &StopTime.is_timepoint?/1)

        case timepoints do
          [] ->
            nil

          _ ->
            timepoint_status = scheduled_timepoint_status(timepoints, now_time_of_day)

            %{
              route_id: trip.route_id,
              route_pattern_id: trip.route_pattern_id,
              direction_id: trip.direction_id,
              trip_id: trip.id,
              run_id: trip.run_id,
              time_since_trip_start_time: now_time_of_day - trip.start_time,
              headsign: trip.headsign,
              via_variant:
                trip.route_pattern_id && RoutePattern.via_variant(trip.route_pattern_id),
              timepoint_status: timepoint_status
            }
        end
    end
  end

  @spec scheduled_timepoint_status([StopTime.t()], Util.Time.time_of_day()) :: timepoint_status()
  def scheduled_timepoint_status(timepoints, now) do
    cond do
      now <= List.first(timepoints).time ->
        # Trip isn't scheduled to have started yet
        %{
          timepoint_id: List.first(timepoints).timepoint_id,
          fraction_until_timepoint: 0.0
        }

      now >= List.last(timepoints).time ->
        # Trip is scheduled to have finished
        %{
          timepoint_id: List.last(timepoints).timepoint_id,
          fraction_until_timepoint: 0.0
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
