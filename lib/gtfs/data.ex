defmodule Gtfs.Data do
  @moduledoc """
  GTFS Data management
  """
  require Logger

  alias Gtfs.{
    Block,
    Calendar,
    Csv,
    Direction,
    Helpers,
    Route,
    RoutePattern,
    Service,
    Stop,
    StopTime,
    Trip
  }

  @type t :: %__MODULE__{
          routes: [Route.t()],
          route_patterns: [RoutePattern.t()],
          stops: stops_by_id(),
          trips: %{Trip.id() => Trip.t()},
          blocks: Block.by_id(),
          calendar: Calendar.t()
        }

  @type stops_by_id :: %{Stop.id() => Stop.t()}

  @type directions_by_route_and_id :: %{Route.id() => %{Direction.id() => Direction.t()}}

  @enforce_keys [
    :routes,
    :route_patterns,
    :stops,
    :trips,
    :blocks,
    :calendar
  ]

  defstruct [
    :routes,
    :route_patterns,
    :stops,
    :trips,
    :blocks,
    :calendar
  ]

  @type files :: %{optional(String.t()) => binary()}

  @spec all_routes(t()) :: [Route.t()]
  def all_routes(%__MODULE__{routes: routes}), do: routes

  @spec timepoint_ids_on_route(t(), Route.id()) :: [StopTime.timepoint_id()]
  def timepoint_ids_on_route(
        %__MODULE__{route_patterns: route_patterns} = data,
        route_id
      ) do
    timepoint_ids_by_direction =
      route_patterns
      |> route_patterns_by_direction(route_id)
      |> Helpers.map_values(fn route_patterns ->
        timepoint_ids_for_route_patterns(route_patterns, data)
      end)

    Helpers.merge_lists([
      timepoint_ids_by_direction |> Map.get(0, []) |> Enum.reverse(),
      Map.get(timepoint_ids_by_direction, 1, [])
    ])
  end

  @spec stop(t(), Stop.id()) :: Stop.t() | nil
  def stop(%__MODULE__{stops: stops}, stop_id), do: stops[stop_id]

  @spec trip(t(), Trip.id()) :: Trip.t() | nil
  def trip(%__MODULE__{trips: trips}, trip_id), do: trips[trip_id]

  @spec block(t(), Block.id(), Service.id()) :: Block.t() | nil
  def block(%__MODULE__{blocks: blocks}, block_id, service_id) do
    Block.get(blocks, block_id, service_id)
  end

  @spec parse_files(files()) :: t()
  def parse_files(files) do
    directions_by_route_id = directions_by_route_id(files["directions.txt"])

    bus_routes =
      Csv.parse(
        files["routes.txt"],
        &Route.bus_route_row?/1,
        &Route.from_csv_row(&1, directions_by_route_id)
      )

    bus_route_ids = MapSet.new(bus_routes, & &1.id)
    bus_trips = bus_trips(files["trips.txt"], files["stop_times.txt"], bus_route_ids)

    %__MODULE__{
      routes: bus_routes,
      route_patterns: bus_route_patterns(files["route_patterns.txt"], bus_route_ids),
      stops: all_stops_by_id(files["stops.txt"]),
      trips: Map.new(bus_trips, fn trip -> {trip.id, trip} end),
      blocks: Block.group_trips_by_block(bus_trips),
      calendar: Calendar.from_files(files["calendar.txt"], files["calendar_dates.txt"])
    }
  end

  @spec route_patterns_by_direction([RoutePattern.t()], Route.id()) :: %{
          Direction.id() => [RoutePattern.t()]
        }
  defp route_patterns_by_direction(route_patterns, route_id) do
    route_patterns
    |> RoutePattern.for_route_id(route_id)
    |> RoutePattern.by_direction()
  end

  # All route_patterns should be in the same direction
  @spec timepoint_ids_for_route_patterns([RoutePattern.t()], t()) :: [StopTime.timepoint_id()]
  defp timepoint_ids_for_route_patterns(route_patterns, data) do
    route_patterns
    |> Enum.map(fn route_pattern ->
      trip_id = route_pattern.representative_trip_id
      trip = trip(data, trip_id)

      trip.stop_times
      |> Enum.map(fn stop_time -> stop_time.timepoint_id end)
      |> Enum.filter(& &1)
    end)
    |> Helpers.merge_lists()
  end

  @spec directions_by_route_id(binary()) :: directions_by_route_and_id()
  defp directions_by_route_id(directions_data) do
    directions_data
    |> Csv.parse(fn _row -> true end, &Direction.from_csv_row/1)
    |> Enum.reduce(%{}, fn direction, acc ->
      put_in(
        acc,
        Enum.map([direction.route_id, direction.direction_id], &Access.key(&1, %{})),
        direction
      )
    end)
  end

  @spec bus_route_patterns(binary(), MapSet.t(Route.id())) :: [RoutePattern.t()]
  defp bus_route_patterns(route_patterns_data, bus_route_ids) do
    Csv.parse(
      route_patterns_data,
      &RoutePattern.row_in_route_id_set?(&1, bus_route_ids),
      &RoutePattern.from_csv_row/1
    )
  end

  @spec all_stops_by_id(binary()) :: stops_by_id()
  defp all_stops_by_id(stops_data) do
    stops_data
    |> Csv.parse(fn _row -> true end, &Stop.from_csv_row/1)
    |> Map.new(fn stop -> {stop.id, stop} end)
  end

  @spec bus_trips(binary(), binary(), MapSet.t(Route.id())) :: [Trip.t()]
  defp bus_trips(trips_data, stop_times_data, bus_route_ids) do
    bus_trips =
      Csv.parse(
        trips_data,
        &Trip.row_in_route_id_set?(&1, bus_route_ids),
        &Trip.from_csv_row/1
      )

    bus_trip_ids = MapSet.new(bus_trips, & &1.id)

    bus_trip_stop_times =
      stop_times_data
      |> Csv.parse(&StopTime.row_in_trip_id_set?(&1, bus_trip_ids))
      |> StopTime.trip_stop_times_from_csv()

    Enum.map(bus_trips, fn trip ->
      %{trip | stop_times: Map.fetch!(bus_trip_stop_times, trip.id)}
    end)
  end
end
