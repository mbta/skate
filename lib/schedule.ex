defmodule Schedule do
  @moduledoc """
  A repository for accessing and updating static schedule data stored in memory
  """
  require Logger

  alias Schedule.{
    Block,
    Data,
    Hastus,
    Trip,
    Swing,
    Piece
  }

  alias Schedule.Gtfs.{
    Direction,
    Route,
    RoutePattern,
    Shape,
    Stop,
    Timepoint
  }

  alias Schedule.Run

  @type state :: :not_loaded | {:loaded, Data.t()}
  @type persistent_term_key :: term()

  @typedoc """
  For mocking tests
  E.g.
  %{
    gtfs: %{
      "stops.txt" => [
        "stop_id,stop_name",
        "place-sstat,South Station",
      ]
    }
  }
  """
  @type mocked_files :: %{
          optional(:gtfs) => %{String.t() => [binary()]},
          optional(:hastus) => %{String.t() => [binary()]}
        }

  # Queries (Client)

  @spec all_routes() :: [Route.t()]
  @spec all_routes(persistent_term_key()) :: [Route.t()]
  def all_routes(persistent_term_key \\ __MODULE__) do
    call_with_data(persistent_term_key, [], :all_routes, [])
  end

  @spec route_by_id(Route.id(), persistent_term_key()) :: Route.t() | nil
  def route_by_id(route_id, persistent_term_key \\ __MODULE__) do
    persistent_term_key |> all_routes() |> Enum.find(&(&1.id == route_id))
  end

  # Timepoint IDs on a route, sorted in order of stop sequence
  @spec timepoints_on_route(Route.id()) :: [Timepoint.t()]
  @spec timepoints_on_route(Route.id(), persistent_term_key()) :: [Timepoint.t()]
  def timepoints_on_route(route_id, persistent_term_key \\ __MODULE__) do
    call_with_data(
      persistent_term_key,
      [route_id],
      :timepoints_on_route,
      []
    )
  end

  @spec timepoint_names_by_id(persistent_term_key()) :: Timepoint.timepoint_names_by_id()
  def timepoint_names_by_id(persistent_term_key \\ __MODULE__) do
    call_with_data(persistent_term_key, [], :timepoint_names_by_id, %{})
  end

  @spec stop(Stop.id()) :: Stop.t() | nil
  @spec stop(Stop.id(), persistent_term_key()) :: Stop.t() | nil
  def stop(stop_id, persistent_term_key \\ __MODULE__) do
    call_with_data(persistent_term_key, [stop_id], :stop, nil)
  end

  @spec trip(Trip.id()) :: Trip.t() | nil
  @spec trip(Trip.id(), persistent_term_key()) :: Trip.t() | nil
  def trip(trip_id, persistent_term_key \\ __MODULE__) do
    call_with_data(persistent_term_key, [trip_id], :trip, nil)
  end

  @spec trips_by_id([Trip.id()]) :: %{Trip.id() => Trip.t()}
  @spec trips_by_id([Trip.id()], persistent_term_key()) :: %{Trip.id() => Trip.t()}
  def trips_by_id(trip_ids, persistent_term_key \\ __MODULE__) do
    call_with_data(persistent_term_key, [trip_ids], :trips_by_id, nil)
  end

  @spec block(Hastus.Schedule.id(), Block.id()) :: Block.t() | nil
  @spec block(Hastus.Schedule.id(), Block.id(), persistent_term_key()) :: Block.t() | nil
  def block(schedule_id, block_id, persistent_term_key \\ __MODULE__) do
    call_with_data(persistent_term_key, [schedule_id, block_id], :block, nil)
  end

  @doc """
  All trips that are scheduled to be active at the given time, on all routes.
  """
  @spec trips_starting_in_range(Util.Time.timestamp(), Util.Time.timestamp()) :: [Trip.t()]
  @spec trips_starting_in_range(
          Util.Time.timestamp(),
          Util.Time.timestamp(),
          persistent_term_key()
        ) ::
          [Trip.t()]
  def trips_starting_in_range(start_time, end_time, persistent_term_key \\ __MODULE__) do
    call_with_data(persistent_term_key, [start_time, end_time], :trips_starting_in_range, [])
  end

  @doc """
  All of the blocks that are scheduled to be active any time between the start_time and end_time.

  The result is grouped by date.
  If a block is scheduled to be active on two dates during that time, it wil be in both dates' lists.
  """
  @spec active_blocks(Util.Time.timestamp(), Util.Time.timestamp()) :: %{Date.t() => [Block.t()]}
  @spec active_blocks(Util.Time.timestamp(), Util.Time.timestamp(), persistent_term_key()) ::
          %{Date.t() => [Block.t()]}
  def active_blocks(start_time, end_time, persistent_term_key \\ __MODULE__) do
    call_with_data(
      persistent_term_key,
      [start_time, end_time],
      :active_blocks,
      %{}
    )
  end

  @spec active_runs(Util.Time.timestamp(), Util.Time.timestamp()) :: %{Date.t() => [Run.t()]}
  @spec active_runs(Util.Time.timestamp(), Util.Time.timestamp(), persistent_term_key()) :: %{
          Date.t() => [Run.t()]
        }
  def active_runs(start_time, end_time, persistent_term_key \\ __MODULE__) do
    call_with_data(persistent_term_key, [start_time, end_time], :active_runs, %{})
  end

  @spec shapes(Route.id()) :: [Shape.t()]
  @spec shapes(Route.id(), persistent_term_key()) :: [Shape.t()]
  def shapes(route_id, persistent_term_key \\ __MODULE__) do
    call_with_data(persistent_term_key, [route_id], :shapes, [])
  end

  @spec shape_for_trip(Trip.id()) :: Shape.t() | nil
  @spec shape_for_trip(Trip.id(), persistent_term_key()) :: Shape.t() | nil
  def shape_for_trip(trip_id, persistent_term_key \\ __MODULE__) do
    call_with_data(persistent_term_key, [trip_id], :shape_for_trip, nil)
  end

  @spec shape_with_stops_for_trip(Trip.id(), persistent_term_key()) ::
          Schedule.ShapeWithStops.t() | nil
  def shape_with_stops_for_trip(trip_id, persistent_term_key \\ __MODULE__) do
    call_with_data(persistent_term_key, [trip_id], :shape_with_stops_for_trip, nil)
  end

  def stations(persistent_term_key \\ __MODULE__) do
    call_with_data(persistent_term_key, [], :stations, [])
  end

  def all_stops(persistent_term_key \\ __MODULE__) do
    call_with_data(persistent_term_key, [], :all_stops, [])
  end

  @spec route_pattern(RoutePattern.id(), persistent_term_key()) :: RoutePattern.t() | nil
  def route_pattern(route_pattern_id, persistent_term_key \\ __MODULE__) do
    call_with_data(persistent_term_key, [route_pattern_id], :route_pattern, nil)
  end

  @spec first_route_pattern_for_route_and_direction(Route.id(), Direction.id()) ::
          RoutePattern.t() | nil
  @spec first_route_pattern_for_route_and_direction(
          Route.id(),
          Direction.id(),
          persistent_term_key()
        ) :: RoutePattern.t() | nil
  def first_route_pattern_for_route_and_direction(
        route_id,
        direction_id,
        persistent_term_key \\ __MODULE__
      ) do
    call_with_data(
      persistent_term_key,
      [route_id, direction_id],
      :first_route_pattern_for_route_and_direction,
      nil
    )
  end

  @spec route_patterns_for_route(Route.id()) :: [RoutePattern.t()]
  @spec route_patterns_for_route(Route.id(), persistent_term_key()) :: [RoutePattern.t()]
  @doc """
  Get all route patterns associated with the given route.
  """
  def route_patterns_for_route(route_id, persistent_term_key \\ __MODULE__) do
    call_with_data(
      persistent_term_key,
      [route_id],
      :route_patterns_for_route,
      []
    )
  end

  @spec run_for_trip(Hastus.Run.id(), Trip.id()) :: Run.t() | nil
  @spec run_for_trip(Hastus.Run.id(), Trip.id(), persistent_term_key()) :: Run.t() | nil
  def run_for_trip(run_id, trip_id, persistent_term_key \\ __MODULE__) do
    call_with_data(persistent_term_key, [run_id, trip_id], :run_for_trip, nil)
  end

  @spec timepoint_names_for_run(Run.t() | nil, persistent_term_key()) :: [Timepoint.t()]
  def timepoint_names_for_run(run, persistent_term_key \\ __MODULE__)

  def timepoint_names_for_run(nil, _persistent_term_key) do
    nil
  end

  def timepoint_names_for_run(run, persistent_term_key) do
    run
    |> Run.pieces()
    |> timepoint_names_for_pieces(persistent_term_key)
  end

  @spec timepoint_names_for_pieces([Piece.t()], persistent_term_key()) :: [Timepoint.t()]
  defp timepoint_names_for_pieces(pieces, persistent_term_key) do
    timepoint_names_by_id = call_with_data(persistent_term_key, [], :timepoint_names_by_id, %{})

    pieces
    |> Enum.map(&Piece.scheduled_trips/1)
    |> Enum.map(&timepoint_names_for_trips(&1, timepoint_names_by_id))
    |> List.flatten()
    |> Enum.uniq()
  end

  defp timepoint_names_for_trips(trips, timepoint_names_by_id) do
    trips
    |> Enum.reject(&is_nil/1)
    |> Enum.flat_map(&Trip.timepoints/1)
    |> Enum.map(&Timepoint.timepoint_from_names_by_id(timepoint_names_by_id, &1.timepoint_id))
  end

  @spec block_for_trip(Trip.id()) :: Block.t() | nil
  @spec block_for_trip(Trip.id(), persistent_term_key()) :: Block.t() | nil
  def block_for_trip(trip_id, persistent_term_key \\ __MODULE__) do
    call_with_data(persistent_term_key, [trip_id], :block_for_trip, nil)
  end

  @spec timepoint_names_for_block(Block.t() | nil, persistent_term_key()) :: [Timepoint.t()]
  def timepoint_names_for_block(block, persistent_term_key \\ __MODULE__)

  def timepoint_names_for_block(nil, _persistent_term_key) do
    nil
  end

  def timepoint_names_for_block(block, persistent_term_key) do
    block
    |> Block.pieces()
    |> timepoint_names_for_pieces(persistent_term_key)
  end

  @spec swings_for_route(
          Route.id(),
          Util.Time.timestamp(),
          Util.Time.timestamp(),
          persistent_term_key()
        ) :: [Swing.t()] | nil
  def swings_for_route(route_id, start_time, end_time, persistent_term_key \\ __MODULE__) do
    call_with_data(
      persistent_term_key,
      [route_id, start_time, end_time],
      :swings_for_route,
      nil
    )
  end

  @doc """
  Get the version for the loaded schedule data
  """
  @spec version(persistent_term_key()) :: String.t() | nil
  def version(persistent_term_key \\ __MODULE__) do
    call_with_data(
      persistent_term_key,
      [],
      :version,
      nil
    )
  end

  @doc """
  Try to load the Data out of :persistent_term for querying, or return a default value.
  """
  @spec call_with_data(persistent_term_key(), any(), atom(), any()) :: any()
  def call_with_data(persistent_term_key, args, function_name, default_result) do
    data_get_fn = Application.get_env(:skate, :schedule_data_get_fn, &persistent_term_lookup/2)

    case data_get_fn.(persistent_term_key, :not_loaded) do
      {:loaded, data} ->
        apply(Data, function_name, [data | args])

      :not_loaded ->
        default_result
    end
  end

  defp persistent_term_lookup(key, default_value) do
    :persistent_term.get(key, default_value)
  end

  @spec update_state(state(), term()) :: :ok
  def update_state(state, key \\ __MODULE__) do
    log_persistent_term_info("persistent_term_info_before")
    log_erlang_memory_info("erlang_memory_before")

    {time, :ok} = :timer.tc(:persistent_term, :put, [key, state])

    log_persistent_term_info(
      "persistent_term_info_after wrote state to persistent term time_in_ms=#{System.convert_time_unit(time, :microsecond, :millisecond)}"
    )

    # More expensive call to get_system_memory_data
    system_memory = :memsup.get_system_memory_data()
    log_erlang_memory_info("erlang_memory_after system_free=#{system_memory[:free_memory]}}")

    :ok
  end

  defp log_persistent_term_info(prefix) do
    %{count: count, memory: memory} = :persistent_term.info()
    Logger.info("#{prefix} count=#{count} memory=#{memory}")
  end

  defp log_erlang_memory_info(prefix) do
    # Possible that this data hasn't been updated since last call
    {total, allocated, worst} = :memsup.get_memory_data()
    process_name = :erlang.process_info(elem(worst, 0), :registered_name)

    Logger.info(
      "#{prefix} memory=#{total} allocated=#{allocated} worst=#{inspect(worst)} worst_name=#{inspect(process_name)}"
    )
  end

  # Initialization (Testing)
  @spec start_mocked(mocked_files(), pid() | nil) :: persistent_term_key()
  def start_mocked(mocked_files, health_server_pid \\ nil) do
    persistent_term_key = {:schedule_mocked, :erlang.phash2(mocked_files)}

    {:ok, pid} =
      GenServer.start_link(Schedule.Fetcher,
        files_source: {:mocked_files, mocked_files},
        health_server: health_server_pid,
        updater_function: fn state ->
          update_state(state, persistent_term_key)
        end
      )

    ref = Process.monitor(pid)

    receive do
      {:DOWN, ^ref, :process, ^pid, exit_ok}
      when exit_ok in [:normal, :noproc] ->
        persistent_term_key

      {:DOWN, ^ref, :process, ^pid, error} ->
        raise "Schedule.Fetcher exited with #{inspect(error)}"
    after
      100 ->
        if Process.alive?(pid) do
          raise "Schedule.Fetcher failed to terminate"
        end
    end
  end
end
