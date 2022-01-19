defmodule Schedule do
  use GenServer
  require Logger

  alias Schedule.{
    Block,
    Data,
    Hastus,
    Health,
    Trip,
    Swing
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

  defdelegate default_tables(), to: Schedule.Fetcher

  @type state :: :not_loaded | {:loaded, Data.tables()}

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
  @spec all_routes(GenServer.server()) :: [Route.t()]
  def all_routes(_server \\ __MODULE__) do
    Data.all_routes(default_tables())
  end

  @spec route_by_id(Route.id(), GenServer.server()) :: Route.t() | nil
  def route_by_id(route_id, _server \\ __MODULE__) do
    Data.route_by_id(default_tables(), route_id)
  end

  # Timepoint IDs on a route, sorted in order of stop sequence
  @spec timepoints_on_route(Route.id()) :: [Timepoint.t()]
  @spec timepoints_on_route(Route.id(), GenServer.server()) :: [Timepoint.t()]
  def timepoints_on_route(route_id, _server \\ __MODULE__) do
    Data.timepoints_on_route(default_tables(), route_id)
  end

  @spec timepoint_names_by_id(GenServer.server()) :: Timepoint.timepoint_names_by_id()
  def timepoint_names_by_id(_server \\ __MODULE__) do
    Data.timepoint_names_by_id(default_tables())
  end

  @spec stop(Stop.id()) :: Stop.t() | nil
  @spec stop(Stop.id(), GenServer.server()) :: Stop.t() | nil
  def stop(stop_id, _server \\ __MODULE__) do
    Data.stop(default_tables(), stop_id)
  end

  @spec trip(Trip.id()) :: Trip.t() | nil
  @spec trip(Trip.id(), GenServer.server()) :: Trip.t() | nil
  def trip(trip_id, _server \\ __MODULE__) do
    Data.trip(default_tables(), trip_id)
  end

  @spec trips_by_id([Trip.id()]) :: %{Trip.id() => Trip.t()}
  @spec trips_by_id([Trip.id()], GenServer.server()) :: %{Trip.id() => Trip.t()}
  def trips_by_id(trip_ids, _server \\ __MODULE__) do
    Data.trips_by_id(default_tables(), trip_ids)
  end

  @spec block(Hastus.Schedule.id(), Block.id()) :: Block.t() | nil
  @spec block(Hastus.Schedule.id(), Block.id(), GenServer.server()) :: Block.t() | nil
  def block(schedule_id, block_id, _server \\ __MODULE__) do
    Data.block(default_tables(), schedule_id, block_id)
  end

  @doc """
  All trips that are scheduled to be active at the given time, on all routes.
  """
  @spec active_trips(Util.Time.timestamp(), Util.Time.timestamp()) :: [Trip.t()]
  @spec active_trips(Util.Time.timestamp(), Util.Time.timestamp(), GenServer.server()) ::
          [Trip.t()]
  def active_trips(start_time, end_time, _server \\ __MODULE__) do
    Data.active_trips(default_tables(), start_time, end_time)
  end

  @doc """
  All of the blocks that are scheduled to be active any time between the start_time and end_time.

  The result is grouped by date.
  If a block is scheduled to be active on two dates during that time, it wil be in both dates' lists.
  """
  @spec active_blocks(Util.Time.timestamp(), Util.Time.timestamp()) :: %{Date.t() => [Block.t()]}
  @spec active_blocks(Util.Time.timestamp(), Util.Time.timestamp(), GenServer.server()) ::
          %{Date.t() => [Block.t()]}
  def active_blocks(start_time, end_time, _server \\ __MODULE__) do
    Data.active_blocks(default_tables(), start_time, end_time)
  end

  @spec active_runs(Util.Time.timestamp(), Util.Time.timestamp()) :: %{Date.t() => [Run.t()]}
  @spec active_runs(Util.Time.timestamp(), Util.Time.timestamp(), GenServer.server()) :: %{
          Date.t() => [Run.t()]
        }
  def active_runs(start_time, end_time, _server \\ __MODULE__) do
    Data.active_runs(default_tables(), start_time, end_time)
  end

  @spec shapes(Route.id()) :: [Shape.t()]
  @spec shapes(Route.id(), GenServer.server()) :: [Shape.t()]
  def shapes(route_id, _server \\ __MODULE__) do
    Data.shapes(default_tables(), route_id)
  end

  @spec shape_for_trip(Trip.id()) :: Shape.t() | nil
  @spec shape_for_trip(Trip.id(), GenServer.server()) :: Shape.t() | nil
  def shape_for_trip(trip_id, _server \\ __MODULE__) do
    Data.shape_for_trip(default_tables(), trip_id)
  end

  @spec first_route_pattern_for_route_and_direction(Route.id(), Direction.id()) ::
          RoutePattern.t() | nil
  @spec first_route_pattern_for_route_and_direction(
          Route.id(),
          Direction.id(),
          GenServer.server()
        ) :: RoutePattern.t() | nil
  def first_route_pattern_for_route_and_direction(route_id, direction_id, _server \\ __MODULE__) do
    Data.first_route_pattern_for_route_and_direction(default_tables(), route_id, direction_id)
  end

  @spec run_for_trip(Hastus.Run.id(), Trip.id()) :: Run.t() | nil
  @spec run_for_trip(Hastus.Run.id(), Trip.id(), GenServer.server()) :: Run.t() | nil
  def run_for_trip(run_id, trip_id, server \\ __MODULE__) do
    call_catch_timeout(server, {:run_for_trip, run_id, trip_id}, :run_for_trip, nil)
  end

  @spec block_for_trip(Trip.id()) :: Block.t() | nil
  @spec block_for_trip(Trip.id(), GenServer.server()) :: Block.t() | nil
  def block_for_trip(trip_id, server \\ __MODULE__) do
    call_catch_timeout(server, {:block_for_trip, trip_id}, :block_for_trip, nil)
  end

  @spec swings_for_route(
          Route.id(),
          Util.Time.timestamp(),
          Util.Time.timestamp(),
          GenServer.server()
        ) :: [Swing.t()] | nil
  def swings_for_route(route_id, start_time, end_time, server \\ __MODULE__) do
    call_catch_timeout(
      server,
      {:swings_for_route, route_id, start_time, end_time},
      :swings_for_route,
      nil
    )
  end

  @doc """
  Handle Schedule server timeouts gracefully
  """
  @spec call_catch_timeout(GenServer.server(), any(), atom(), any()) :: any()
  def call_catch_timeout(server, arg, function_name, default_result) do
    try do
      GenServer.call(server, arg) || default_result
    catch
      :exit, _ ->
        Logger.warn("module=#{__MODULE__} function=#{function_name} error=timeout")
        default_result
    end
  end

  # Queries (Server)

  @impl true
  def handle_call({:new_schedule_state, new_state}, _from, _state) do
    {:reply, :ok, new_state}
  end

  def handle_call(_message, _from, :not_loaded = state) do
    {:reply, nil, state}
  end

  def handle_call(:all_routes, _from, {:loaded, tables} = state) do
    {:reply, Data.all_routes(tables), state}
  end

  def handle_call({:timepoints_on_route, route_id}, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.timepoints_on_route(gtfs_data, route_id), state}
  end

  def handle_call({:timepoint_names_by_id}, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.timepoint_names_by_id(gtfs_data), state}
  end

  def handle_call({:stop, stop_id}, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.stop(gtfs_data, stop_id), state}
  end

  def handle_call({:trip, trip_id}, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.trip(gtfs_data, trip_id), state}
  end

  def handle_call({:trips_by_id, trip_ids}, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.trips_by_id(gtfs_data, trip_ids), state}
  end

  def handle_call({:block, schedule_id, block_id}, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.block(gtfs_data, schedule_id, block_id), state}
  end

  def handle_call({:active_trips, start_time, end_time}, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.active_trips(gtfs_data, start_time, end_time), state}
  end

  def handle_call({:active_blocks, start_time, end_time}, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.active_blocks(gtfs_data, start_time, end_time), state}
  end

  def handle_call({:active_runs, start_time, end_time}, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.active_runs(gtfs_data, start_time, end_time), state}
  end

  def handle_call({:shapes, route_id}, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.shapes(gtfs_data, route_id), state}
  end

  def handle_call({:shape_for_trip, trip_id}, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.shape_for_trip(gtfs_data, trip_id), state}
  end

  def handle_call(
        {:first_route_pattern_for_route_and_direction, route_id, direction_id},
        _from,
        {:loaded, gtfs_data} = state
      ) do
    {:reply, Data.first_route_pattern_for_route_and_direction(gtfs_data, route_id, direction_id),
     state}
  end

  def handle_call({:run_for_trip, run_id, trip_id}, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.run_for_trip(gtfs_data, run_id, trip_id), state}
  end

  def handle_call({:block_for_trip, trip_id}, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.block_for_trip(gtfs_data, trip_id), state}
  end

  def handle_call(
        {:swings_for_route, route_id, start_time, end_time},
        _from,
        {:loaded, gtfs_data} = state
      ) do
    {:reply, Data.swings_for_route(gtfs_data, route_id, start_time, end_time), state}
  end

  @spec update_state(state(), GenServer.server()) :: :ok
  def update_state(state, pid \\ __MODULE__) do
    GenServer.call(pid, {:new_schedule_state, state})
  end

  # Initialization (Client)

  @spec start_link([]) :: GenServer.on_start()
  def start_link([]) do
    GenServer.start_link(
      __MODULE__,
      {:remote, Health.Server.default_server()},
      name: __MODULE__
    )
  end

  @spec start_mocked(mocked_files(), pid() | nil) :: pid()
  def start_mocked(mocked_files, health_server_pid \\ nil) do
    {:ok, pid} = GenServer.start_link(__MODULE__, [])

    {:ok, fetcher_pid} =
      Schedule.Fetcher.start_link(
        files_source: {:mocked_files, mocked_files},
        health_server: health_server_pid,
        updater_function: fn state ->
          update_state(state, pid)
        end
      )

    ref = Process.monitor(fetcher_pid)

    receive do
      {:DOWN, ^ref, :process, ^fetcher_pid, :normal} -> :ok
    after
      5_000 ->
        raise "Schedule.Fetcher did not terminate"
    end

    pid
  end

  # Initialization (Server)

  @impl true
  def init(_opts) do
    {:ok, :not_loaded}
  end
end
