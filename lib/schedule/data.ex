defmodule Schedule.Data do
  @moduledoc """
  GTFS Data management
  """
  require Logger

  alias Schedule.Block
  alias Schedule.Csv
  alias Schedule.TimepointOrder
  alias Schedule.Trip
  alias Schedule.Minischedule
  alias Schedule.Swing

  alias Schedule.Gtfs

  alias Schedule.Gtfs.{
    Calendar,
    Direction,
    FeedInfo,
    Route,
    RoutePattern,
    Service,
    Shape,
    Stop,
    StopTime,
    Timepoint
  }

  @type t :: %__MODULE__{
          routes: [Route.t()],
          route_patterns: [RoutePattern.t()],
          timepoints_by_route: TimepointOrder.timepoints_by_route(),
          timepoint_names_by_id: Timepoint.timepoint_names_by_id(),
          shapes: shapes_by_route_id(),
          stops: stops_by_id(),
          trips: Trip.by_id(),
          blocks: Block.by_id(),
          calendar: Calendar.t(),
          minischedule_runs: Minischedule.Run.by_id(),
          minischedule_blocks: Minischedule.Block.by_id(),
          swings: Swing.by_schedule_id_and_route_id()
        }

  @type shapes_by_route_id :: %{Route.id() => [Shape.t()]}

  @type stops_by_id :: %{Stop.id() => Stop.t()}

  @type directions_by_route_and_id :: %{Route.id() => %{Direction.id() => Direction.t()}}

  defstruct routes: [],
            route_patterns: [],
            timepoints_by_route: %{},
            timepoint_names_by_id: %{},
            shapes: %{},
            stops: %{},
            trips: %{},
            blocks: %{},
            calendar: %{},
            minischedule_runs: %{},
            minischedule_blocks: %{},
            swings: %{}

  @type files :: %{String.t() => binary()}

  @type all_files :: %{
          gtfs: %{String.t() => binary()},
          hastus: %{String.t() => binary()}
        }

  @spec all_routes(t()) :: [Route.t()]
  def all_routes(%__MODULE__{routes: routes}), do: routes

  @spec timepoints_on_route(t(), Route.id()) :: [Timepoint.t()]
  def timepoints_on_route(
        %__MODULE__{timepoints_by_route: timepoints_by_route},
        route_id
      ),
      do: Map.get(timepoints_by_route, route_id, [])

  @spec stop(t(), Stop.id()) :: Stop.t() | nil
  def stop(%__MODULE__{stops: stops}, stop_id), do: stops[stop_id]

  @spec trip(t(), Trip.id()) :: Trip.t() | nil
  def trip(%__MODULE__{trips: trips}, trip_id), do: trips[trip_id]

  @spec block(t(), Block.id(), Service.id()) :: Block.t() | nil
  def block(%__MODULE__{blocks: blocks}, block_id, service_id) do
    Block.get(blocks, block_id, service_id)
  end

  @doc """
  The late night and early morning schedules overlap,
  so a timestamp can potentially refer to service on multiple dates

  This function might return a broader range than necessary,
  because you have to filter by time later anyway,
  and missing dates would mean missing relevant service.
  """
  @spec potentially_active_service_dates(Util.Time.timestamp(), Util.Time.timestamp()) ::
          [Date.t()]
  def potentially_active_service_dates(start_time, end_time) do
    first_possible_service_date =
      start_time
      |> (fn time -> time - 6 * 60 * 60 end).()
      |> Util.Time.date_of_timestamp()

    last_possible_service_date =
      end_time
      |> Util.Time.date_of_timestamp()

    date_range = Date.range(first_possible_service_date, last_possible_service_date)
    Enum.to_list(date_range)
  end

  @spec active_trips(t(), Util.Time.timestamp(), Util.Time.timestamp()) :: [Trip.t()]
  def active_trips(%__MODULE__{calendar: calendar, trips: trips}, start_time, end_time) do
    dates = potentially_active_service_dates(start_time, end_time)
    active_services = Map.take(calendar, dates)

    trips_by_service =
      trips
      |> Map.values()
      |> Enum.group_by(fn trip -> trip.service_id end)

    Enum.flat_map(active_services, fn {date, service_ids} ->
      start_time_of_day = Util.Time.time_of_day_for_timestamp(start_time, date)
      end_time_of_day = Util.Time.time_of_day_for_timestamp(end_time, date)

      trips_on_date =
        Enum.flat_map(service_ids, fn service_id ->
          Map.get(trips_by_service, service_id, [])
        end)

      active_trips_on_date =
        Enum.filter(trips_on_date, fn trip ->
          Trip.is_active(trip, start_time_of_day, end_time_of_day)
        end)

      active_trips_on_date
    end)
  end

  @spec active_blocks(t(), Util.Time.timestamp(), Util.Time.timestamp()) ::
          %{Date.t() => [Block.t()]}
  def active_blocks(%__MODULE__{blocks: blocks, calendar: calendar}, start_time, end_time) do
    dates = potentially_active_service_dates(start_time, end_time)
    active_services = Map.take(calendar, dates)

    blocks_by_service =
      blocks
      |> Map.values()
      |> Enum.group_by(fn block -> block.service_id end)

    active_services
    |> Map.new(fn {date, service_ids} ->
      start_time_of_day = Util.Time.time_of_day_for_timestamp(start_time, date)
      end_time_of_day = Util.Time.time_of_day_for_timestamp(end_time, date)

      blocks_on_date =
        Enum.flat_map(service_ids, fn service_id ->
          Map.get(blocks_by_service, service_id, [])
        end)

      active_blocks_on_date =
        Enum.filter(blocks_on_date, fn block ->
          Block.is_active(block, start_time_of_day, end_time_of_day)
        end)

      {date, active_blocks_on_date}
    end)
    |> Helpers.filter_values(fn blocks -> blocks != [] end)
  end

  @spec shapes(t(), Route.id()) :: [Shape.t()]
  def shapes(%__MODULE__{shapes: shapes}, route_id), do: Map.get(shapes, route_id, [])

  @spec shape_for_trip(t(), Trip.id()) :: Shape.t() | nil
  def shape_for_trip(%__MODULE__{shapes: shapes, trips: trips}, trip_id) do
    trip = Map.get(trips, trip_id)

    if trip != nil do
      route_shapes = Map.get(shapes, trip.route_id, [])
      Enum.find(route_shapes, fn shape -> shape.id == trip.shape_id end)
    else
      nil
    end
  end

  @spec first_route_pattern_for_route_and_direction(t(), Route.id(), Direction.id()) ::
          RoutePattern.t() | nil
  def first_route_pattern_for_route_and_direction(
        %__MODULE__{route_patterns: route_patterns},
        route_id,
        direction_id
      ) do
    Enum.find(route_patterns, fn route_pattern ->
      route_pattern.route_id == route_id && route_pattern.direction_id == direction_id
    end)
  end

  @spec minischedule_run(t(), Trip.id()) :: Minischedule.Run.t() | nil
  def minischedule_run(
        %__MODULE__{
          trips: trips,
          minischedule_runs: runs,
          timepoint_names_by_id: timepoint_names_by_id
        },
        trip_id
      ) do
    trip = trips[trip_id]

    if trip != nil && trip.schedule_id != nil do
      # we have HASTUS data for this trip
      run = runs[{trip.schedule_id, trip.run_id}]
      Minischedule.Run.hydrate(run, trips, timepoint_names_by_id)
    else
      nil
    end
  end

  @spec minischedule_block(t(), Trip.id()) :: Minischedule.Block.t() | nil
  def minischedule_block(
        %__MODULE__{
          trips: trips,
          minischedule_blocks: blocks,
          timepoint_names_by_id: timepoint_names_by_id
        },
        trip_id
      ) do
    trip = trips[trip_id]

    if trip != nil && trip.schedule_id != nil do
      # we have HASTUS data for this trip
      block = blocks[{trip.schedule_id, trip.block_id}]
      Minischedule.Block.hydrate(block, trips, timepoint_names_by_id)
    else
      nil
    end
  end

  @spec swings_for_route(t(), Route.id(), Util.Time.timestamp(), Util.Time.timestamp()) ::
          [Swing.t()] | nil
  def swings_for_route(
        %__MODULE__{calendar: calendar, swings: swings},
        route_id,
        start_time,
        end_time
      ) do
    dates = potentially_active_service_dates(start_time, end_time)
    active_services = Map.take(calendar, dates)

    Enum.flat_map(active_services, fn {_data, service_ids} ->
      Enum.flat_map(service_ids, fn service_id ->
        Map.get(swings, {service_id, route_id}, [])
      end)
    end)
  end

  # Initialization

  @spec parse_files(all_files()) :: t()
  def parse_files(%{gtfs: gtfs_files, hastus: hastus_files}) do
    hastus_activities = Schedule.Hastus.Activity.parse(hastus_files["activities.csv"])
    hastus_trips = Schedule.Hastus.Trip.parse(hastus_files["trips.csv"])

    %{
      runs: minischedule_runs,
      blocks: minischedule_blocks
    } = Schedule.Minischedule.Load.from_hastus(hastus_activities, hastus_trips)

    gtfs_files["feed_info.txt"]
    |> FeedInfo.parse()
    |> FeedInfo.log_gtfs_version()

    directions_by_route_id = directions_by_route_id(gtfs_files["directions.txt"])

    bus_routes =
      Csv.parse(
        gtfs_files["routes.txt"],
        filter: &Route.bus_route_row?/1,
        parse: &Route.from_csv_row(&1, directions_by_route_id)
      )

    bus_route_ids = bus_route_ids(bus_routes)

    route_patterns = bus_route_patterns(gtfs_files["route_patterns.txt"], bus_route_ids)

    timepoints_by_id = all_timepoints_by_id(gtfs_files["checkpoints.txt"])

    gtfs_trips = Gtfs.Trip.parse(gtfs_files["trips.txt"], bus_route_ids)
    gtfs_trip_ids = MapSet.new(gtfs_trips, & &1.id)
    stop_times_by_id = StopTime.parse(gtfs_files["stop_times.txt"], gtfs_trip_ids)
    trips_by_id = Trip.merge_trips(gtfs_trips, hastus_trips, stop_times_by_id)

    %__MODULE__{
      routes: bus_routes,
      route_patterns: route_patterns,
      timepoints_by_route:
        TimepointOrder.timepoints_for_routes(
          route_patterns,
          stop_times_by_id,
          timepoints_by_id
        ),
      timepoint_names_by_id: timepoint_names_for_ids(timepoints_by_id),
      shapes: shapes_by_route_id(gtfs_files["shapes.txt"], gtfs_trips),
      stops: all_stops_by_id(gtfs_files["stops.txt"]),
      trips: trips_by_id,
      blocks: Block.blocks_from_trips(Map.values(trips_by_id)),
      calendar: Calendar.from_files(gtfs_files["calendar.txt"], gtfs_files["calendar_dates.txt"]),
      minischedule_runs: minischedule_runs,
      minischedule_blocks: minischedule_blocks,
      swings: Swing.from_minischedule_blocks(minischedule_blocks, trips_by_id)
    }
  end

  @spec directions_by_route_id(binary()) :: directions_by_route_and_id()
  defp directions_by_route_id(directions_data) do
    directions_data
    |> Csv.parse(parse: &Direction.from_csv_row/1)
    |> Enum.reduce(%{}, fn direction, acc ->
      put_in(
        acc,
        Enum.map([direction.route_id, direction.direction_id], &Access.key(&1, %{})),
        direction
      )
    end)
  end

  @spec bus_route_ids([Route.t()]) :: MapSet.t(Route.id())
  defp bus_route_ids(bus_routes), do: MapSet.new(bus_routes, & &1.id)

  @spec bus_route_patterns(binary(), MapSet.t(Route.id())) :: [RoutePattern.t()]
  defp bus_route_patterns(route_patterns_data, bus_route_ids) do
    Csv.parse(
      route_patterns_data,
      filter: &RoutePattern.row_in_route_id_set?(&1, bus_route_ids),
      parse: &RoutePattern.from_csv_row/1
    )
  end

  @spec all_timepoints_by_id(binary()) :: Timepoint.timepoints_by_id()
  defp all_timepoints_by_id(timepoints_data) do
    timepoints_data
    |> Csv.parse(parse: &Timepoint.from_csv_row/1)
    |> Map.new(fn timepoint -> {timepoint.id, timepoint} end)
  end

  @spec timepoint_names_for_ids(Timepoint.timepoints_by_id()) :: Timepoint.timepoint_names_by_id()
  defp timepoint_names_for_ids(timepoints_by_id) do
    timepoints_by_id
    |> Map.new(fn {id, timepoint} -> {id, timepoint.name} end)
    |> Map.merge(Timepoint.garage_names_by_id())
  end

  @spec shapes_by_route_id(binary(), [Gtfs.Trip.t()]) :: shapes_by_route_id()
  defp shapes_by_route_id(shapes_data, trips) do
    shapes_by_id = Shape.from_file(shapes_data)

    trips
    |> Enum.group_by(fn trip -> trip.route_id end)
    |> Helpers.map_values(&shape_ids_on_trips/1)
    |> Helpers.map_values(fn shape_ids_on_route ->
      get_shapes_by_ids(shape_ids_on_route, shapes_by_id)
    end)
  end

  @spec shape_ids_on_trips([Gtfs.Trip.t()]) :: [Shape.id()]
  defp shape_ids_on_trips(trips) do
    trips
    |> Enum.map(fn trip -> trip.shape_id end)
    |> Enum.uniq()
    |> Enum.filter(fn shape_id -> shape_id != nil end)
  end

  @spec get_shapes_by_ids([Shape.id()], Shape.shapes_by_id()) :: [Shape.t()]
  defp get_shapes_by_ids(shape_ids, shapes_by_id) do
    shape_ids
    |> Enum.map(fn shape_id -> Map.get(shapes_by_id, shape_id) end)
    |> Enum.filter(fn shape -> shape != nil end)
  end

  @spec all_stops_by_id(binary()) :: stops_by_id()
  defp all_stops_by_id(stops_data) do
    stops_data
    |> Csv.parse(parse: &Stop.from_csv_row/1)
    |> Map.new(fn stop -> {stop.id, stop} end)
  end
end
