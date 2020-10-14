defmodule Schedule.TimepointOrder do
  alias Schedule.Gtfs.RoutePattern
  alias Schedule.Gtfs.Timepoint

  @spec timepoints_for_routes(
          [RoutePattern.t()],
          MapSet.t(Route.id()),
          StopTime.by_trip_id(),
          Timepoint.timepoints_by_id()
        ) ::
          Schedule.timepoints_by_route()
  def timepoints_for_routes(route_patterns, route_ids, stop_times_by_id, timepoints_by_id) do
    Map.new(route_ids, fn route_id ->
      {route_id,
       timepoints_for_route(route_patterns, route_id, stop_times_by_id, timepoints_by_id)}
    end)
  end

  @spec timepoints_for_route(
          [RoutePattern.t()],
          Route.id(),
          StopTime.by_trip_id(),
          Timepoint.timepoints_by_id()
        ) ::
          [
            Timepoint.t()
          ]
  def timepoints_for_route(route_patterns, route_id, stop_times_by_id, timepoints_by_id) do
    timepoints_by_direction =
      route_patterns
      |> route_patterns_by_direction(route_id)
      |> Helpers.map_values(fn route_patterns ->
        timepoints_for_route_patterns(route_patterns, stop_times_by_id, timepoints_by_id)
      end)

    Schedule.Helpers.merge_lists([
      timepoints_by_direction |> Map.get(0, []) |> Enum.reverse(),
      Map.get(timepoints_by_direction, 1, [])
    ])
  end

  # All route_patterns should be in the same direction
  @spec timepoints_for_route_patterns(
          [RoutePattern.t()],
          StopTime.by_trip_id(),
          Timepoint.timepoints_by_id()
        ) :: [
          Timepoint.t()
        ]
  defp timepoints_for_route_patterns(route_patterns, stop_times_by_id, timepoints_by_id) do
    route_patterns
    |> Enum.map(fn route_pattern ->
      trip_id = route_pattern.representative_trip_id
      stop_times = stop_times_by_id[trip_id]

      stop_times
      |> Enum.filter(& &1.timepoint_id)
      |> Enum.map(fn stop_time ->
        Timepoint.timepoint_for_id(timepoints_by_id, stop_time.timepoint_id)
      end)
    end)
    |> Schedule.Helpers.merge_lists()
  end

  @spec route_patterns_by_direction([RoutePattern.t()], Route.id()) :: %{
          Direction.id() => [RoutePattern.t()]
        }
  defp route_patterns_by_direction(route_patterns, route_id) do
    route_patterns
    |> RoutePattern.for_route_id(route_id)
    |> RoutePattern.by_direction()
  end
end
