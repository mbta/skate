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
      timepoints_for_route(route_patterns, stop_times_by_id, timepoints_by_id)
    end)
  end

  @spec timepoints_for_route(
          [RoutePattern.t()],
          StopTime.by_trip_id(),
          Timepoint.timepoints_by_id()
        ) ::
          [
            Timepoint.t()
          ]
  def timepoints_for_route(route_patterns, stop_times_by_id, timepoints_by_id) do
    route_patterns
    |> Enum.map(fn route_pattern ->
      timepoints_for_route_pattern(route_pattern, stop_times_by_id, timepoints_by_id)
    end)
    |> Schedule.Helpers.merge_lists()
  end

  # Returns timepoints in the 0 to 1 order
  @spec timepoints_for_route_pattern(
          RoutePattern.t(),
          StopTime.by_trip_id(),
          Timepoint.timepoints_by_id()
        ) :: [
          Timepoint.t()
        ]
  defp timepoints_for_route_pattern(route_pattern, stop_times_by_id, timepoints_by_id) do
    trip_id = route_pattern.representative_trip_id
    stop_times = stop_times_by_id[trip_id]

    timepoints =
      stop_times
      |> Enum.filter(& &1.timepoint_id)
      |> Enum.map(fn stop_time ->
        Timepoint.timepoint_for_id(timepoints_by_id, stop_time.timepoint_id)
      end)

    if route_pattern.direction_id == 0 do
      Enum.reverse(timepoints)
    else
      timepoints
    end
  end
end
