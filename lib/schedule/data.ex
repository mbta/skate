defmodule Schedule.Data do
  @moduledoc """
  GTFS Data management
  """
  require Logger

  alias Schedule.Block
  alias Schedule.Csv
  alias Schedule.TimepointOrder
  alias Schedule.Run
  alias Schedule.Hastus
  alias Schedule.Swing
  alias Schedule.Garage

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
          trips: Schedule.Trip.by_id(),
          blocks: Block.by_id(),
          calendar: Calendar.t(),
          runs: Run.by_id(),
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
            runs: %{},
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

  @spec timepoint_names_by_id(t()) :: Timepoint.timepoint_names_by_id()
  def timepoint_names_by_id(%__MODULE__{timepoint_names_by_id: timepoint_names_by_id}),
    do: timepoint_names_by_id

  @spec stop(t(), Stop.id()) :: Stop.t() | nil
  def stop(%__MODULE__{stops: stops}, stop_id), do: stops[stop_id]

  @spec trip(t(), Schedule.Trip.id()) :: Schedule.Trip.t() | nil
  def trip(%__MODULE__{trips: trips}, trip_id), do: trips[trip_id]

  @spec trips_by_id(t(), [Schedule.Trip.id()]) :: %{Schedule.Trip.id() => Schedule.Trip.t()}
  def trips_by_id(%__MODULE__{trips: trips}, trip_ids) do
    Map.take(trips, trip_ids)
  end

  @spec block(t(), Block.id(), Service.id()) :: Block.t() | nil
  def block(%__MODULE__{blocks: blocks}, schedule_id, block_id) do
    Block.get(blocks, schedule_id, block_id)
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

  @spec active_trips(t(), Util.Time.timestamp(), Util.Time.timestamp()) :: [Schedule.Trip.t()]
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
          Schedule.Trip.is_active(trip, start_time_of_day, end_time_of_day)
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

  @spec active_runs(t(), Util.Time.timestamp(), Util.Time.timestamp()) ::
          %{Date.t() => [Run.t()]}
  def active_runs(
        %__MODULE__{runs: runs, calendar: calendar},
        start_time,
        end_time
      ) do
    dates = potentially_active_service_dates(start_time, end_time)
    active_services = Map.take(calendar, dates)

    runs_by_service =
      runs
      |> Map.values()
      |> Enum.group_by(fn run -> run.service_id end)

    active_services
    |> Map.new(fn {date, service_ids} ->
      start_time_of_day = Util.Time.time_of_day_for_timestamp(start_time, date)
      end_time_of_day = Util.Time.time_of_day_for_timestamp(end_time, date)

      runs_on_date =
        Enum.flat_map(service_ids, fn service_id ->
          Map.get(runs_by_service, service_id, [])
        end)

      active_runs_on_date =
        Enum.filter(runs_on_date, fn run ->
          Run.is_active?(run, start_time_of_day, end_time_of_day)
        end)

      {date, active_runs_on_date}
    end)
    |> Helpers.filter_values(fn runs -> runs != [] end)
  end

  @spec shapes(t(), Route.id()) :: [Shape.t()]
  def shapes(%__MODULE__{shapes: shapes}, route_id), do: Map.get(shapes, route_id, [])

  @spec shape_for_trip(t(), Schedule.Trip.id()) :: Shape.t() | nil
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

  @spec run_for_trip(t(), Hastus.Run.id() | nil, Schedule.Trip.id()) :: Run.t() | nil
  def run_for_trip(%__MODULE__{runs: runs, trips: trips}, run_id, trip_id) do
    trip = trips[trip_id]

    cond do
      trip != nil and run_id != nil and trip.schedule_id != nil ->
        runs[{trip.schedule_id, run_id}]

      trip != nil and trip.schedule_id != nil ->
        runs[{trip.schedule_id, trip.run_id}]

      true ->
        nil
    end
  end

  @spec block_for_trip(t(), Schedule.Trip.id()) :: Block.t() | nil
  def block_for_trip(
        %__MODULE__{
          trips: trips,
          blocks: blocks
        },
        trip_id
      ) do
    trip = trips[trip_id]

    if trip != nil && trip.schedule_id != nil do
      # we have HASTUS data for this trip
      blocks[{trip.schedule_id, trip.block_id}]
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
    gtfs_files["feed_info.txt"]
    |> FeedInfo.parse()
    |> FeedInfo.log_gtfs_version()

    directions_by_route_id = directions_by_route_id(gtfs_files["directions.txt"])

    bus_routes =
      Csv.parse(
        gtfs_files["routes.txt"],
        filter: &Route.bus_route_valid_row?/1,
        parse: &Route.from_csv_row(&1, directions_by_route_id)
      )

    bus_route_ids = bus_route_ids(bus_routes)

    gtfs_trips = Gtfs.Trip.parse(gtfs_files["trips.txt"], bus_route_ids)
    gtfs_trip_ids = MapSet.new(gtfs_trips, & &1.id)

    hastus_activities = Hastus.Activity.parse(hastus_files["activities.csv"])

    hastus_trips =
      Hastus.Trip.parse(hastus_files["trips.csv"])
      |> Hastus.Trip.expand_through_routed_trips(gtfs_trip_ids)

    route_patterns = bus_route_patterns(gtfs_files["route_patterns.txt"], bus_route_ids)

    timepoints_by_id = all_timepoints_by_id(gtfs_files["checkpoints.txt"])
    timepoint_names_by_id = timepoint_names_for_ids(timepoints_by_id)

    stop_times_by_id = StopTime.parse(gtfs_files["stop_times.txt"], gtfs_trip_ids)

    schedule_trips_by_id = Schedule.Trip.merge_trips(gtfs_trips, hastus_trips, stop_times_by_id)

    runs =
      runs_from_hastus(
        hastus_activities,
        hastus_trips,
        schedule_trips_by_id,
        timepoint_names_by_id
      )

    pieces =
      runs
      |> Map.values()
      |> Enum.flat_map(&Run.pieces/1)

    blocks = Block.blocks_from_pieces(pieces)

    bus_routes = Garage.add_garages_to_routes(bus_routes, schedule_trips_by_id)

    %__MODULE__{
      routes: bus_routes,
      route_patterns: route_patterns,
      timepoints_by_route:
        TimepointOrder.timepoints_for_routes(
          route_patterns,
          stop_times_by_id,
          timepoints_by_id
        ),
      timepoint_names_by_id: timepoint_names_by_id,
      shapes: shapes_by_route_id(gtfs_files["shapes.txt"], gtfs_trips),
      stops: all_stops_by_id(gtfs_files["stops.txt"]),
      trips: schedule_trips_by_id,
      blocks: blocks,
      calendar: Calendar.from_files(gtfs_files["calendar.txt"], gtfs_files["calendar_dates.txt"]),
      runs: runs,
      swings: Swing.from_blocks(blocks, schedule_trips_by_id)
    }
  end

  @spec runs_from_hastus(
          [Hastus.Activity.t()],
          [Hastus.Trip.t()],
          Schedule.Trip.by_id(),
          Timepoint.timepoint_names_by_id()
        ) ::
          Run.by_id()
  def runs_from_hastus(activities, hastus_trips, schedule_trips_by_id, timepoint_names_by_id) do
    activities_by_run = Enum.group_by(activities, &Hastus.Activity.run_key/1)
    hastus_trips_by_run = Enum.group_by(hastus_trips, &Hastus.Trip.run_key/1)

    activities_and_hastus_trips_by_run =
      Schedule.Helpers.zip_maps([activities_by_run, hastus_trips_by_run])

    hastus_trips_by_block = Enum.group_by(hastus_trips, &Hastus.Trip.block_key/1)

    runs =
      Enum.map(
        activities_and_hastus_trips_by_run,
        fn {run_key, [activities, hastus_trips]} ->
          run_from_hastus(
            run_key,
            activities,
            hastus_trips,
            hastus_trips_by_block,
            schedule_trips_by_id,
            timepoint_names_by_id
          )
        end
      )

    Map.new(runs, fn run -> {Run.key(run), run} end)
  end

  @spec run_from_hastus(
          Run.key(),
          [Hastus.Activity.t()] | nil,
          [Hastus.Trip.t()] | nil,
          %{Block.key() => [Hastus.Trip.t()]},
          Schedule.Trip.by_id(),
          Timepoint.timepoint_names_by_id()
        ) ::
          Run.t()
  def run_from_hastus(
        run_key,
        hastus_activities,
        hastus_trips,
        all_hastus_trips_by_block,
        schedule_trips_by_id,
        timepoint_names_by_id
      ) do
    {schedule_id, run_id} = run_key
    hastus_activities = hastus_activities || []
    hastus_trips = hastus_trips || []

    service_id = unique_service_id_for_trips(hastus_trips, schedule_trips_by_id)

    activities =
      Hastus.Activity.to_pieces_and_breaks(
        hastus_activities,
        hastus_trips,
        all_hastus_trips_by_block,
        schedule_trips_by_id,
        timepoint_names_by_id
      )

    %Run{
      schedule_id: schedule_id,
      service_id: service_id,
      id: run_id,
      activities: activities
    }
  end

  @spec unique_service_id_for_trips([Hastus.Trip.t()], Schedule.Trip.by_id()) ::
          Service.id() | nil
  defp unique_service_id_for_trips(trips, trips_by_id) do
    service_ids =
      trips
      |> Enum.map(& &1.trip_id)
      |> (&Map.take(trips_by_id, &1)).()
      |> Map.values()
      |> Enum.filter(& &1)
      |> Enum.map(& &1.service_id)
      |> Enum.filter(& &1)
      |> Enum.uniq()

    case service_ids do
      [service_id] ->
        service_id

      _ ->
        nil
    end
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
