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

  @type tables :: %{
          routes: atom(),
          route_patterns: atom(),
          timepoints_by_route: atom(),
          timepoint_names_by_id: atom(),
          shapes: atom(),
          stops: atom(),
          trips: atom(),
          blocks: atom(),
          calendar: atom(),
          runs: atom(),
          swings: atom()
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

  @table_schema [
    {:routes, :set, [:id, :route], []},
    {:route_patterns, :set, [:route_id_direction_id, :route_pattern], []},
    {:timepoints_by_route, :set, [:route_id, :timepoints], []},
    {:timepoint_names_by_id, :set, [:ignored, :timepoint_names_by_id], []},
    {:shapes, :set, [:shape_id, :route_id, :shapes], [:route_id]},
    {:stops, :set, [:id, :stop], []},
    {:trips, :set, [:id, :service_id, :start_time, :end_time, :trip], [:service_id]},
    {:blocks, :set, [:id, :service_id, :block], [:service_id]},
    {:calendar, :set, [:date, :service_ids], []},
    {:runs, :set, [:id, :service_id, :run], [:service_id]},
    {:swings, :set, [:service_id_and_route_id, :swings], []}
  ]

  @spec all_routes(tables()) :: [Route.t()]
  def all_routes(%{routes: routes_table}) do
    :mnesia.dirty_select(routes_table, [{{:_, :_, :"$1"}, [], [:"$1"]}])
  end

  @spec route_by_id(tables(), Route.id()) :: Route.t() | nil
  def route_by_id(%{routes: routes_table}, route_id) do
    case :mnesia.dirty_read(routes_table, route_id) do
      [{_, _, route}] -> route
      _ -> nil
    end
  end

  @spec timepoints_on_route(tables(), Route.id()) :: [Timepoint.t()]
  def timepoints_on_route(%{timepoints_by_route: timepoints_by_route_table}, route_id) do
    timepoints_by_route_table
    |> :mnesia.dirty_select([{{:_, route_id, :"$1"}, [], [:"$1"]}])
    |> List.flatten()
  end

  @spec timepoint_names_by_id(tables()) :: Timepoint.timepoint_names_by_id()
  def timepoint_names_by_id(%{timepoint_names_by_id: timepoint_names_by_id_table}) do
    case :mnesia.dirty_read(timepoint_names_by_id_table, nil) do
      [{_, _, timepoint_names_by_id}] -> timepoint_names_by_id
      _ -> %{}
    end
  end

  @spec stop(tables(), Stop.id()) :: Stop.t() | nil
  def stop(%{stops: stops_table}, stop_id) do
    case :mnesia.dirty_read(stops_table, stop_id) do
      [{_, _, stop}] -> stop
      _ -> nil
    end
  end

  @spec trip(tables(), Schedule.Trip.id()) :: Schedule.Trip.t() | nil
  def trip(%{trips: trips_table}, trip_id) do
    case :mnesia.dirty_read(trips_table, trip_id) do
      [{_, _, _, _, _, trip}] -> trip
      _ -> nil
    end
  end

  @spec trips_by_id(tables(), [Schedule.Trip.id()]) :: %{Schedule.Trip.id() => Schedule.Trip.t()}
  def trips_by_id(%{trips: trips_table}, trip_ids) do
    selectors =
      for trip_id <- trip_ids do
        {{:_, trip_id, :_, :_, :_, :"$1"}, [], [:"$1"]}
      end

    trips_table
    |> :mnesia.dirty_select(selectors)
    |> Map.new(fn trip -> {trip.id, trip} end)
  end

  @spec block(tables(), Hastus.Schedule.id(), Block.id()) :: Block.t() | nil
  def block(%{blocks: blocks_table}, schedule_id, block_id) do
    case :mnesia.dirty_read(blocks_table, {schedule_id, block_id}) do
      [{_, _, _, block}] -> block
      _ -> nil
    end
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

  @spec active_trips(tables(), Util.Time.timestamp(), Util.Time.timestamp()) :: [
          Schedule.Trip.t()
        ]
  def active_trips(%{trips: trips_table} = tables, start_time, end_time) do
    dates = potentially_active_service_dates(start_time, end_time)

    dates
    |> active_services_on_dates(tables)
    |> Enum.flat_map(fn {date, service_ids} ->
      start_time_of_day = Util.Time.time_of_day_for_timestamp(start_time, date)
      end_time_of_day = Util.Time.time_of_day_for_timestamp(end_time, date)

      selectors =
        for service_id <- service_ids do
          {{:_, :_, service_id, :"$2", :"$3", :"$1"},
           [{:<, :"$2", end_time_of_day}, {:<, start_time_of_day, :"$3"}], [:"$1"]}
        end

      :mnesia.dirty_select(trips_table, selectors)
    end)
  end

  @spec active_blocks(tables(), Util.Time.timestamp(), Util.Time.timestamp()) ::
          %{Date.t() => [Block.t()]}
  def active_blocks(%{blocks: blocks_table} = tables, start_time, end_time) do
    dates = potentially_active_service_dates(start_time, end_time)

    dates
    |> active_services_on_dates(tables)
    |> Map.new(fn {date, service_ids} ->
      start_time_of_day = Util.Time.time_of_day_for_timestamp(start_time, date)
      end_time_of_day = Util.Time.time_of_day_for_timestamp(end_time, date)

      selectors =
        for service_id <- service_ids do
          {{:_, :_, service_id, :"$1"}, [], [:"$1"]}
        end

      active_blocks =
        blocks_table
        |> :mnesia.dirty_select(selectors)
        |> Enum.filter(&Block.is_active(&1, start_time_of_day, end_time_of_day))

      if active_blocks == [] do
        # will be deleted later
        {nil, []}
      else
        {date, active_blocks}
      end
    end)
    |> Map.delete(nil)
  end

  @spec active_runs(tables(), Util.Time.timestamp(), Util.Time.timestamp()) ::
          %{Date.t() => [Run.t()]}
  def active_runs(
        %{runs: runs_table} = tables,
        start_time,
        end_time
      ) do
    dates = potentially_active_service_dates(start_time, end_time)

    dates
    |> active_services_on_dates(tables)
    |> Map.new(fn {date, service_ids} ->
      start_time_of_day = Util.Time.time_of_day_for_timestamp(start_time, date)
      end_time_of_day = Util.Time.time_of_day_for_timestamp(end_time, date)

      selectors =
        for service_id <- service_ids do
          {{:_, :_, service_id, :"$1"}, [], [:"$1"]}
        end

      active_runs =
        runs_table
        |> :mnesia.dirty_select(selectors)
        |> Enum.filter(&Run.is_active?(&1, start_time_of_day, end_time_of_day))

      if active_runs == [] do
        {nil, []}
      else
        {date, active_runs}
      end
    end)
    |> Map.delete(nil)
  end

  @spec shapes(tables(), Route.id()) :: [Shape.t()]
  def shapes(%{shapes: shapes_table}, route_id) do
    :mnesia.dirty_select(shapes_table, [
      {{:_, :_, route_id, :"$1"}, [], [:"$1"]}
    ])
  end

  @spec shape_for_trip(tables(), Schedule.Trip.id()) :: Shape.t() | nil
  def shape_for_trip(%{shapes: shapes_table} = tables, trip_id) do
    with %{route_id: route_id} <- trip(tables, trip_id),
         [{_, _, _, shape}] <- :mnesia.dirty_index_read(shapes_table, route_id, :route_id) do
      shape
    else
      _ ->
        nil
    end
  end

  @spec first_route_pattern_for_route_and_direction(tables(), Route.id(), Direction.id()) ::
          RoutePattern.t() | nil
  def first_route_pattern_for_route_and_direction(
        %{route_patterns: route_patterns_table},
        route_id,
        direction_id
      ) do
    case :mnesia.dirty_read(
           route_patterns_table,
           {route_id, direction_id}
         ) do
      [{_, _, route_pattern}] -> route_pattern
      _ -> nil
    end
  end

  @spec run_for_trip(tables(), Hastus.Run.id() | nil, Schedule.Trip.id()) :: Run.t() | nil
  def run_for_trip(%{runs: runs_table} = tables, run_id, trip_id) do
    with %{schedule_id: schedule_id, run_id: trip_run_id} <- trip(tables, trip_id),
         true <- is_binary(schedule_id),
         true <- is_binary(run_id) or is_binary(trip_run_id),
         run_key = {schedule_id, run_id || trip_run_id},
         [{_, _, _, run}] <- :mnesia.dirty_read(runs_table, run_key) do
      run
    else
      _ -> nil
    end
  end

  @spec block_for_trip(tables(), Schedule.Trip.id()) :: Block.t() | nil
  def block_for_trip(
        %{blocks: blocks_table} = tables,
        trip_id
      ) do
    with %{schedule_id: schedule_id, block_id: block_id}
         when is_binary(schedule_id) <- trip(tables, trip_id),
         [{_, _, _, block}] <-
           :mnesia.dirty_match_object(blocks_table, {:_, {schedule_id, block_id}, :_, :_}) do
      block
    else
      _ -> nil
    end
  end

  @spec swings_for_route(tables(), Route.id(), Util.Time.timestamp(), Util.Time.timestamp()) ::
          [Swing.t()] | nil
  def swings_for_route(
        %{swings: swings_table} = tables,
        route_id,
        start_time,
        end_time
      ) do
    dates = potentially_active_service_dates(start_time, end_time)

    service_ids =
      dates
      |> active_services_on_dates(tables)
      |> Enum.flat_map(fn {_date, service_ids} -> service_ids end)

    selectors =
      for service_id <- service_ids do
        {{:_, {service_id, route_id}, :"$1"}, [], [:"$1"]}
      end

    swings_table
    |> :mnesia.dirty_select(selectors)
    |> List.flatten()
  end

  # Initialization

  @spec initialize_tables(tables()) :: :ok
  def initialize_tables(tables) do
    Enum.each(@table_schema, fn {table_key, type, columns, extra_indices} ->
      # if the table already exists, any data will be deleted when
      # save_schedule_data_to_tables/2 is called.
      _ =
        :mnesia.create_table(tables[table_key],
          type: type,
          attributes: columns,
          index: extra_indices,
          storage_properties: [ets: [{:read_concurrency, true}]],
          local_content: true
        )
    end)

    tables
    |> Map.values()
    |> :mnesia.wait_for_tables(5_000)

    :ok
  end

  @spec save_schedule_data_to_tables(tables(), t()) :: :ok
  def save_schedule_data_to_tables(tables, schedule_data) do
    write_data = fn ->
      clear_tables(tables)

      Enum.each(schedule_data.routes, fn route ->
        :mnesia.write({tables.routes, route.id, route})
      end)

      # reverse the order so that the first route_pattern for the route/direction is persisted last and kept
      schedule_data.route_patterns
      |> Enum.reverse()
      |> Enum.each(fn route_pattern ->
        :mnesia.write(
          {tables.route_patterns, {route_pattern.route_id, route_pattern.direction_id},
           route_pattern}
        )
      end)

      Enum.each(schedule_data.timepoints_by_route, fn {route_id, timepoints} ->
        :mnesia.write({tables.timepoints_by_route, route_id, timepoints})
      end)

      :mnesia.write({tables.timepoint_names_by_id, nil, schedule_data.timepoint_names_by_id})

      Enum.each(schedule_data.shapes, fn {route_id, shapes} ->
        for shape <- shapes do
          :mnesia.write({tables.shapes, shape.id, route_id, shape})
        end
      end)

      Enum.each(schedule_data.stops, fn {id, stop} -> :mnesia.write({tables.stops, id, stop}) end)

      Enum.each(schedule_data.trips, fn {id, trip} ->
        :mnesia.write({tables.trips, id, trip.service_id, trip.start_time, trip.end_time, trip})
      end)

      Enum.each(schedule_data.blocks, fn {key, block} ->
        :mnesia.write({tables.blocks, key, block.service_id, block})
      end)

      Enum.each(schedule_data.calendar, fn {date, service_ids} ->
        :mnesia.write({tables.calendar, date, service_ids})
      end)

      Enum.each(schedule_data.runs, fn {key, run} ->
        :mnesia.write({tables.runs, key, run.service_id, run})
      end)

      Enum.each(schedule_data.swings, fn {{service_id, route_id}, swings} ->
        :mnesia.write({tables.swings, {service_id, route_id}, swings})
      end)
    end

    transaction!(write_data)
  end

  @spec parse_files(all_files()) :: t()
  def parse_files(%{gtfs: gtfs_files, hastus: hastus_files}) do
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

  @spec transaction!((() -> term)) :: term | no_return
  defp transaction!(fun) do
    {:atomic, result} = :mnesia.transaction(fun)
    result
  end

  @spec clear_tables(tables()) :: :ok
  def clear_tables(tables) do
    # this does not use :mnesia.clear_table/1 as that results in a :nested_transaction exception
    for {_, table} <- tables,
        key <- :mnesia.all_keys(table) do
      :mnesia.delete(table, key, :write)
    end

    :ok
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

  @spec active_services_on_dates([Date.t()], tables()) :: %{Date.t() => [Service.id()]}
  defp active_services_on_dates(dates, %{calendar: calendar_table}) do
    selectors =
      for date <- dates do
        {{:_, date, :_}, [], [:"$_"]}
      end

    calendar_table
    |> :mnesia.dirty_select(selectors)
    |> Map.new(fn {_, date, service_ids} -> {date, service_ids} end)
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
