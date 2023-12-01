defmodule Schedule.TimepointOrder do
  @moduledoc false

  alias Schedule.Gtfs.Direction
  alias Schedule.Gtfs.Route
  alias Schedule.Gtfs.RoutePattern
  alias Schedule.Gtfs.StopTime
  alias Schedule.Gtfs.Timepoint

  @type timepoints_by_route :: %{Route.id() => [Timepoint.t()]}

  @type hints :: %{Route.id() => %{Direction.id() => [Timepoint.id()]}}

  @timepoint_hint_raw_data [File.cwd!(), "data", "timepoint_order.json"]
                           |> Path.join()
                           |> File.read!()

  @spec timepoints_for_routes(
          [RoutePattern.t()],
          StopTime.by_trip_id(),
          Timepoint.timepoints_by_id()
        ) ::
          timepoints_by_route()
  def timepoints_for_routes(route_patterns, stop_times_by_id, timepoints_by_id) do
    hints_by_route =
      Application.get_env(
        :skate,
        Schedule.TimepointOrder,
        %{hints: &hints/0}
      )[:hints].()

    route_patterns
    |> Enum.group_by(fn route_pattern -> route_pattern.route_id end)
    |> Map.new(fn {route_id, route_patterns} ->
      hints = Map.get(hints_by_route, route_id, %{})

      timepoints =
        route_patterns
        |> timepoint_ids_for_route(hints, stop_times_by_id)
        |> Enum.map(fn timepoint_id ->
          Timepoint.timepoint_for_id(timepoints_by_id, timepoint_id)
        end)

      {route_id, timepoints}
    end)
  end

  @spec timepoint_ids_for_route(
          [RoutePattern.t()],
          %{Direction.id() => [Timepoint.id()]},
          StopTime.by_trip_id()
        ) :: [Timepoint.id()]
  def timepoint_ids_for_route(route_patterns, hints, stop_times_by_id) do
    Schedule.Helpers.merge_lists(
      [
        Enum.reverse(Map.get(hints, 0, [])),
        Map.get(hints, 1, [])
      ] ++
        Enum.map(route_patterns, fn route_pattern ->
          timepoint_ids_for_route_pattern(route_pattern, stop_times_by_id)
        end)
    )
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

  @spec hints :: hints()
  def hints do
    parse_hints(@timepoint_hint_raw_data)
  end

  @spec parse_hints(binary()) :: hints()
  def parse_hints(file_binary) do
    file_binary
    |> Jason.decode!()
    |> Helpers.map_values(fn timepoint_ids_by_direction ->
      timepoint_ids_by_direction
      |> Map.delete("comment")
      |> Helpers.map_keys(&Direction.id_from_string/1)
    end)
  end
end
