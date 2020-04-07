defmodule Schedule do
  use GenServer
  require Logger

  alias Schedule.{
    Block,
    CacheFile,
    Data,
    HealthServer,
    Trip
  }

  alias Schedule.Gtfs.{
    Direction,
    Route,
    RoutePattern,
    Service,
    Shape,
    Stop,
    Timepoint
  }

  @type state :: :not_loaded | {:loaded, Data.t()}

  @type files_source :: :remote | {:mocked_files, mocked_files()}

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
  def all_routes(server \\ __MODULE__) do
    GenServer.call(server, :all_routes)
  end

  # Timepoint IDs on a route, sorted in order of stop sequence
  @spec timepoints_on_route(Route.id()) :: [Timepoint.t()]
  @spec timepoints_on_route(Route.id(), GenServer.server()) :: [Timepoint.t()]
  def timepoints_on_route(route_id, server \\ __MODULE__) do
    GenServer.call(server, {:timepoints_on_route, route_id})
  end

  @spec stop(Stop.id()) :: Stop.t() | nil
  @spec stop(Stop.id(), GenServer.server()) :: Stop.t() | nil
  def stop(stop_id, server \\ __MODULE__) do
    try do
      GenServer.call(server, {:stop, stop_id})
    catch
      # Handle Schedule server timeouts gracefully
      :exit, _ ->
        _ = log_timeout(:stop)
        nil
    end
  end

  @spec trip(Trip.id()) :: Trip.t() | nil
  @spec trip(Trip.id(), GenServer.server()) :: Trip.t() | nil
  def trip(trip_id, server \\ __MODULE__) do
    try do
      GenServer.call(server, {:trip, trip_id})
    catch
      # Handle Schedule server timeouts gracefully
      :exit, _ ->
        _ = log_timeout(:trip)
        nil
    end
  end

  @spec block(Block.id(), Service.id()) :: Block.t() | nil
  @spec block(Block.id(), Service.id(), GenServer.server()) :: Block.t() | nil
  def block(block_id, service_id, server \\ __MODULE__) do
    try do
      GenServer.call(server, {:block, block_id, service_id})
    catch
      # Handle Schedule server timeouts gracefully
      :exit, _ ->
        _ = log_timeout(:block)
        nil
    end
  end

  @doc """
  All trips that are scheduled to be active at the given time, on all routes.
  """
  @spec active_trips(Util.Time.timestamp(), Util.Time.timestamp()) :: [Trip.t()]
  @spec active_trips(Util.Time.timestamp(), Util.Time.timestamp(), GenServer.server()) ::
          [Trip.t()]
  def active_trips(start_time, end_time, server \\ __MODULE__) do
    try do
      GenServer.call(server, {:active_trips, start_time, end_time})
    catch
      # Handle Schedule server timeouts gracefully
      :exit, _ ->
        _ = log_timeout(:active_trips)
        []
    end
  end

  @doc """
  All of the blocks that are scheduled to be active any time between the start_time and end_time.

  The result is grouped by route.
  If a block is scheduled to be active on two routes during that time, it wil be in both routes' lists.
  """
  @spec active_blocks(Util.Time.timestamp(), Util.Time.timestamp()) :: %{Date.t() => [Block.t()]}
  @spec active_blocks(Util.Time.timestamp(), Util.Time.timestamp(), GenServer.server()) ::
          %{Date.t() => [Block.t()]}
  def active_blocks(start_time, end_time, server \\ __MODULE__) do
    try do
      GenServer.call(server, {:active_blocks, start_time, end_time})
    catch
      # Handle Schedule server timeouts gracefully
      :exit, _ ->
        _ = log_timeout(:active_blocks)
        []
    end
  end

  @spec shapes(Route.id()) :: [Shape.t()]
  @spec shapes(Route.id(), GenServer.server()) :: [Shape.t()]
  def shapes(route_id, server \\ __MODULE__) do
    try do
      GenServer.call(server, {:shapes, route_id})
    catch
      # Handle Schedule server timeouts gracefully
      :exit, _ ->
        _ = log_timeout(:shapes)
        nil
    end
  end

  @spec shape_for_trip(Trip.id()) :: Shape.t() | nil
  @spec shape_for_trip(Trip.id(), GenServer.server()) :: Shape.t() | nil
  def shape_for_trip(trip_id, server \\ __MODULE__) do
    try do
      GenServer.call(server, {:shape_for_trip, trip_id})
    catch
      # Handle Schedule server timeouts gracefully
      :exit, _ ->
        _ = log_timeout(:shapes)
        nil
    end
  end

  @spec first_route_pattern_for_route_and_direction(Route.id(), Direction.id()) ::
          RoutePattern.t() | nil
  @spec first_route_pattern_for_route_and_direction(
          Route.id(),
          Direction.id(),
          GenServer.server()
        ) :: RoutePattern.t() | nil
  def first_route_pattern_for_route_and_direction(route_id, direction_id, server \\ __MODULE__) do
    try do
      GenServer.call(
        server,
        {:first_route_pattern_for_route_and_direction, route_id, direction_id}
      )
    catch
      # Handle Schedule server timeouts gracefully
      :exit, _ ->
        _ = log_timeout(:first_route_pattern_for_route_and_direction)
        nil
    end
  end

  defp log_timeout(function) do
    Logger.warn("module=#{__MODULE__} function=#{function} error=timeout")
  end

  # Queries (Server)

  @impl true
  def handle_call(:all_routes, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.all_routes(gtfs_data), state}
  end

  def handle_call({:timepoints_on_route, route_id}, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.timepoints_on_route(gtfs_data, route_id), state}
  end

  def handle_call({:stop, stop_id}, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.stop(gtfs_data, stop_id), state}
  end

  def handle_call({:trip, trip_id}, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.trip(gtfs_data, trip_id), state}
  end

  def handle_call({:block, block_id, service_id}, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.block(gtfs_data, block_id, service_id), state}
  end

  def handle_call({:active_trips, start_time, end_time}, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.active_trips(gtfs_data, start_time, end_time), state}
  end

  def handle_call({:active_blocks, start_time, end_time}, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.active_blocks(gtfs_data, start_time, end_time), state}
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

  # Initialization (Client)

  @spec start_link([]) :: GenServer.on_start()
  def start_link([]) do
    GenServer.start_link(
      __MODULE__,
      {:remote, HealthServer.default_server()},
      name: __MODULE__
    )
  end

  @spec start_mocked(mocked_files(), pid() | nil) :: pid()
  def start_mocked(mocked_files, health_server_pid \\ nil) do
    {:ok, pid} =
      GenServer.start_link(__MODULE__, {{:mocked_files, mocked_files}, health_server_pid})

    pid
  end

  # Initialization (Server)

  @impl true
  def init({files_source, health_server_pid}) do
    {:ok, :not_loaded, {:continue, {:load_gtfs, files_source, health_server_pid}}}
  end

  @impl true
  def handle_continue({:load_gtfs, files_source, health_server_pid}, :not_loaded) do
    start_time = Time.utc_now()

    with {:ok, data} <- fetch_gtfs(files_source) do
      state = {:loaded, data}

      Logger.info(fn ->
        "Successfully loaded gtfs, time_in_ms=#{
          Time.diff(Time.utc_now(), start_time, :millisecond)
        }"
      end)

      if health_server_pid do
        HealthServer.loaded(health_server_pid)
      end

      {:noreply, state}
    else
      {:error, error} ->
        Logger.error(fn ->
          "Error loading gtfs, time_in_ms=#{Time.diff(Time.utc_now(), start_time, :millisecond)}"
        end)

        {:stop, error}
    end
  end

  @spec fetch_gtfs(files_source()) :: {:ok, Data.t()} | {:error, any()}
  defp fetch_gtfs({:mocked_files, mocked_files}) do
    data =
      mocked_files
      |> files_from_mocked()
      |> Data.parse_files()

    {:ok, data}
  end

  defp fetch_gtfs(:remote) do
    if CacheFile.should_use_file?() do
      Logger.info("Loading gfts data from cached file")

      with {:ok, data} <- CacheFile.load_gtfs() do
        {:ok, data}
      else
        _ ->
          with {:ok, data} <- gtfs_from_url() do
            CacheFile.save_gtfs(data)
            {:ok, data}
          else
            {:error, error} ->
              {:error, error}
          end
      end
    else
      gtfs_from_url()
    end
  end

  @spec gtfs_from_url() :: {:ok, Data.t()} | {:error, any()}
  defp gtfs_from_url() do
    Logger.info("Loading gtfs data remote files")

    with {:files, files} <- fetch_remote_files() do
      data = Data.parse_files(files)
      {:ok, data}
    else
      {:error, error} ->
        {:error, error}
    end
  end

  @spec fetch_remote_files() :: {:files, Data.all_files()} | {:error, any()}
  def fetch_remote_files() do
    gtfs_url = Application.get_env(:skate, :gtfs_url)
    hastus_url = Application.get_env(:skate, :hastus_url)

    gtfs_file_names = [
      "calendar.txt",
      "calendar_dates.txt",
      "checkpoints.txt",
      "directions.txt",
      "routes.txt",
      "route_patterns.txt",
      "shapes.txt",
      "stop_times.txt",
      "stops.txt",
      "trips.txt"
    ]

    hastus_file_names = [
      "trips.csv"
    ]

    with {:ok, hastus_files} <- fetch_zip(hastus_url, hastus_file_names),
         {:ok, gtfs_files} <- fetch_zip(gtfs_url, gtfs_file_names) do
      {:files,
       %{
         gtfs: gtfs_files,
         hastus: hastus_files
       }}
    else
      {:error, error} ->
        {:error, error}
    end
  end

  @spec fetch_zip(String.t(), [String.t()]) :: {:ok, Data.files()} | {:error, any()}
  def fetch_zip(url, file_names) do
    case HTTPoison.get(url) do
      {:ok, %HTTPoison.Response{status_code: 200, body: zip_binary}} ->
        unzipped_files = unzip_files(zip_binary, file_names)
        {:ok, unzipped_files}

      response ->
        Logger.warn(fn -> "Unexpected response from #{url} : #{inspect(response)}" end)
        {:error, response}
    end
  end

  @spec files_from_mocked(mocked_files()) :: Data.all_files()
  defp files_from_mocked(mocked_files) do
    for key <- [:gtfs, :hastus], into: %{} do
      {key,
       case mocked_files[key] do
         nil ->
           %{}

         files ->
           for {file_name, lines} <- files, into: %{} do
             {file_name, Enum.join(lines, "\n")}
           end
       end}
    end
  end

  # Takes in the binary data of a zip file, and a list of files to extract
  # Returns a map from those file names to the data in each file
  @spec unzip_files(binary(), [String.t()]) :: Data.files()
  defp unzip_files(zip_binary, file_names) do
    # erlang needs file names as charlists.
    file_names = Enum.map(file_names, &String.to_charlist/1)
    {:ok, unzipped_files} = :zip.unzip(zip_binary, [{:file_list, file_names}, :memory])

    unzipped_files
    # Convert filenames back from charlists to strings
    |> Enum.map(fn {file_name, data} -> {to_string(file_name), data} end)
    |> Map.new()
  end
end
