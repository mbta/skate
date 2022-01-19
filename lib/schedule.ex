defmodule Schedule do
  alias Schedule.{
    Block,
    Data,
    Hastus,
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
  def run_for_trip(run_id, trip_id, _server \\ __MODULE__) do
    Data.run_for_trip(default_tables(), run_id, trip_id)
  end

  @spec block_for_trip(Trip.id()) :: Block.t() | nil
  @spec block_for_trip(Trip.id(), GenServer.server()) :: Block.t() | nil
  def block_for_trip(trip_id, _server \\ __MODULE__) do
    Data.block_for_trip(default_tables(), trip_id)
  end

  @spec swings_for_route(
          Route.id(),
          Util.Time.timestamp(),
          Util.Time.timestamp(),
          GenServer.server()
        ) :: [Swing.t()] | nil
  def swings_for_route(route_id, start_time, end_time, _server \\ __MODULE__) do
    Data.swings_for_route(default_tables(), route_id, start_time, end_time)
  end

  # Test Initialization (Client)
  @spec start_mocked(mocked_files(), pid() | nil) :: GenServer.on_start()
  def start_mocked(mocked_files, health_server_pid \\ nil) do
    {:ok, fetcher_pid} =
      Schedule.Fetcher.start_link(
        files_source: {:mocked_files, mocked_files},
        health_server: health_server_pid,
        updater_function: fn _ -> :ok end
      )

    ref = Process.monitor(fetcher_pid)

    receive do
      {:DOWN, ^ref, :process, ^fetcher_pid, :normal} -> :ok
    after
      5_000 ->
        raise "Schedule.Fetcher did not terminate"
    end

    :ignore
  end
end
