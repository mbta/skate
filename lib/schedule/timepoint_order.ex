defmodule Schedule.TimepointOrder do
  alias Schedule.Gtfs.RoutePattern
  alias Schedule.Gtfs.Timepoint

  @spec timepoints_for_routes(
          [RoutePattern.t()],
          StopTime.by_trip_id(),
          Timepoint.timepoints_by_id()
        ) ::
          Schedule.timepoints_by_route()
  def timepoints_for_routes(route_patterns, stop_times_by_id, timepoints_by_id) do
    route_patterns
    |> Enum.group_by(fn route_pattern -> route_pattern.route_id end)
    |> Helpers.map_values(fn route_patterns ->
      route_patterns
      |> timepoint_ids_for_route(stop_times_by_id)
      |> Enum.map(fn timepoint_id ->
        Timepoint.timepoint_for_id(timepoints_by_id, timepoint_id)
      end)
    end)
  end

  @spec timepoint_ids_for_route(
          [RoutePattern.t()],
          StopTime.by_trip_id()
        ) :: [Timepoint.id()]
  def timepoint_ids_for_route(route_patterns, stop_times_by_id) do
    route_patterns
    |> Enum.map(fn route_pattern ->
      timepoint_ids_for_route_pattern(route_pattern, stop_times_by_id)
    end)
    |> Schedule.Helpers.merge_lists()
  end

  # Returns timepoints in the 0 to 1 order
  @spec timepoint_ids_for_route_pattern(
          RoutePattern.t(),
          StopTime.by_trip_id()
        ) :: [Timepoint.id()]
  defp timepoint_ids_for_route_pattern(route_pattern, stop_times_by_id) do
    trip_id = route_pattern.representative_trip_id
    stop_times = stop_times_by_id[trip_id]

    timepoint_ids =
      stop_times
      |> Enum.map(fn stop_time -> stop_time.timepoint_id end)
      |> Enum.filter(& &1)

    if route_pattern.direction_id == 0 do
      Enum.reverse(timepoint_ids)
    else
      timepoint_ids
    end
  end
end
