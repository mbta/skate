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

    Gtfs.Helpers.merge_lists([
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

  @spec active_trips_by_date(t(), Util.Time.timestamp(), Util.Time.timestamp()) :: %{
          Date.t() => [Trip.t()]
        }
  def active_trips_by_date(%__MODULE__{trips: trips, calendar: calendar}, start_time, end_time) do
    # We might cover multiple service dates
    # If we start before 6am, check trips on the previous day
    # It's okay if this date range is a little too broad, since we check trips by time on those dates later
    first_possible_service_date =
      start_time
      |> (fn time -> time - 6 * 60 * 60 end).()
      |> Util.Time.date_of_timestamp()

    last_possible_service_date =
      end_time
      |> Util.Time.date_of_timestamp()

    date_range = Date.range(first_possible_service_date, last_possible_service_date)
    dates = Enum.to_list(date_range)
    active_services = Map.take(calendar, dates)

    trips_by_service =
      trips
      |> Map.values()
      |> Enum.group_by(fn trip -> trip.service_id end)

    trips_by_date =
      Map.new(active_services, fn {date, service_ids} ->
        start_time_of_day = Util.Time.time_of_day_for_timestamp(start_time, date)
        end_time_of_day = Util.Time.time_of_day_for_timestamp(end_time, date)

        trips_on_date =
          Enum.flat_map(service_ids, fn service_id ->
            Map.get(trips_by_service, service_id, [])
          end)

        active_trips =
          Enum.filter(trips_on_date, fn trip ->
            end_time_of_day > Trip.start_time(trip) and
              start_time_of_day < Trip.end_time(trip)
          end)

        {date, active_trips}
      end)

    trips_by_date
    |> Enum.filter(fn {_date, trips} -> trips != [] end)
    |> Map.new()
  end

  @spec active_trips_on_route(t(), Route.id(), Util.Time.timestamp(), Util.Time.timestamp()) :: [
          Trip.t()
        ]
  def active_trips_on_route(data, route_id, start_time, end_time) do
    active_trips_by_date =
      active_trips_by_date(
        data,
        start_time,
        end_time
      )

    Enum.flat_map(active_trips_by_date, fn {_date, trips} ->
      Enum.filter(trips, fn trip -> trip.route_id == route_id end)
    end)
  end

  @spec active_blocks(t(), Util.Time.timestamp(), Util.Time.timestamp()) :: %{
          Route.id() => [Block.id()]
        }
  def active_blocks(data, start_time, end_time) do
    active_trips_by_date = active_trips_by_date(data, start_time, end_time)

    active_blocks_per_route =
      active_trips_by_date
      |> Enum.flat_map(fn {_date, trips} -> trips end)
      |> Enum.group_by(
        fn trip -> trip.route_id end,
        fn trip -> trip.block_id end
      )
      |> Helpers.map_values(&Enum.uniq/1)

    active_blocks_per_route
  end

  # Initialization

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
    |> Gtfs.Helpers.merge_lists()
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
