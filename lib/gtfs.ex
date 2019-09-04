defmodule Gtfs do
  use GenServer
  require Logger

  alias Gtfs.{Block, CacheFile, Data, HealthServer, Route, Service, Stop, StopTime, Trip}

  @type state :: :not_loaded | {:loaded, Data.t()}

  @type files_source :: {:url, String.t()} | {:mocked_files, mocked_files()}

  defstruct data: nil,
            health_server_pid: nil,
            load_task: nil,
            loaded?: false

  @typedoc """
  For mocking tests
  E.g.
  %{
    "stops.txt" => [
      "stop_id,stop_name",
      "place-sstat,South Station",
    ]
  ]}
  """
  @type mocked_files :: %{optional(String.t()) => [binary()]}

  # Queries (Client)

  @spec all_routes() :: [Route.t()]
  @spec all_routes(GenServer.server()) :: [Route.t()]
  def all_routes(server \\ __MODULE__) do
    call_with_default(server, :all_routes, [])
  end

  # Timepoint IDs on a route, sorted in order of stop sequence
  @spec timepoint_ids_on_route(Route.id()) :: [StopTime.timepoint_id()]
  @spec timepoint_ids_on_route(Route.id(), GenServer.server()) ::
          [StopTime.timepoint_id()]
  def timepoint_ids_on_route(route_id, server \\ __MODULE__) do
    call_with_default(server, {:timepoint_ids_on_route, route_id}, [])
  end

  @spec stop(Stop.id()) :: Stop.t() | nil
  @spec stop(Stop.id(), GenServer.server()) :: Stop.t() | nil
  def stop(stop_id, server \\ __MODULE__) do
    call_with_default(server, {:stop, stop_id}, nil)
  end

  @spec trip(Trip.id()) :: Trip.t() | nil
  @spec trip(Trip.id(), GenServer.server()) :: Trip.t() | nil
  def trip(trip_id, server \\ __MODULE__) do
    call_with_default(server, {:trip, trip_id}, nil)
  end

  @spec block(Block.id(), Service.id()) :: Block.t() | nil
  @spec block(Block.id(), Service.id(), GenServer.server()) ::
          Block.t() | nil
  def block(block_id, service_id, server \\ __MODULE__) do
    call_with_default(server, {:block, block_id, service_id}, nil)
  end

  @doc """
  All trips that are scheduled to be active at the given time, on all routes.
  """
  @spec active_trips(Util.Time.timestamp()) :: [Trip.t()]
  @spec active_trips(Util.Time.timestamp(), GenServer.server()) ::
          [Trip.t()]
  def active_trips(now, server \\ __MODULE__) do
    call_with_default(server, {:active_trips, now}, [])
  end

  @doc """
  All of the blocks that are scheduled to be active any time between the start_time and end_time.

  The result is grouped by route.
  If a block is scheduled to be active on two routes during that time, it wil be in both routes' lists.
  """
  @spec active_blocks(Util.Time.timestamp(), Util.Time.timestamp()) :: Route.by_id([Block.id()])
  @spec active_blocks(Util.Time.timestamp(), Util.Time.timestamp(), GenServer.server()) ::
          Route.by_id([Block.id()])
  def active_blocks(start_time, end_time, server \\ __MODULE__) do
    call_with_default(server, {:active_blocks, start_time, end_time}, %{})
  end

  defp call_with_default(server, call, default) do
    server
    |> GenServer.call(call)
    |> case do
      {:error, :not_loaded} -> default
      data -> data
    end
  end

  # Queries (Server)

  @impl true
  def handle_call(:loaded?, _from, %__MODULE__{loaded?: loaded?} = state) do
    # used by tests only
    {:reply, loaded?, state}
  end

  def handle_call(_, _from, %__MODULE__{loaded?: false} = state) do
    {:reply, {:error, :not_loaded}, state}
  end

  def handle_call(:all_routes, _from, %__MODULE__{loaded?: true, data: gtfs_data} = state) do
    {:reply, Data.all_routes(gtfs_data), state}
  end

  def handle_call(
        {:timepoint_ids_on_route, route_id},
        _from,
        %__MODULE__{loaded?: true, data: gtfs_data} = state
      ) do
    {:reply, Data.timepoint_ids_on_route(gtfs_data, route_id), state}
  end

  def handle_call({:stop, stop_id}, _from, %__MODULE__{loaded?: true, data: gtfs_data} = state) do
    {:reply, Data.stop(gtfs_data, stop_id), state}
  end

  def handle_call({:trip, trip_id}, _from, %__MODULE__{loaded?: true, data: gtfs_data} = state) do
    {:reply, Data.trip(gtfs_data, trip_id), state}
  end

  def handle_call(
        {:block, block_id, service_id},
        _from,
        %__MODULE__{loaded?: true, data: gtfs_data} = state
      ) do
    {:reply, Data.block(gtfs_data, block_id, service_id), state}
  end

  def handle_call(
        {:active_trips, now},
        _from,
        %__MODULE__{loaded?: true, data: gtfs_data} = state
      ) do
    {:reply, Data.active_trips(gtfs_data, now), state}
  end

  def handle_call(
        {:active_blocks, start_time, end_time},
        _from,
        %__MODULE__{loaded?: true, data: gtfs_data} = state
      ) do
    {:reply, Data.active_blocks(gtfs_data, start_time, end_time), state}
  end

  @impl GenServer
  def handle_info({ref, {time, {:ok, data}}}, %__MODULE__{load_task: %Task{ref: ref}} = state) do
    state = %{state | loaded?: true, data: data}

    Logger.warn(fn ->
      "Successfully loaded gtfs, time_in_ms=#{time / 1000}"
    end)

    if state.health_server_pid do
      HealthServer.loaded(state.health_server_pid)
    end

    {:noreply, state}
  end

  def handle_info({ref, {time, {:error, error}}}, %__MODULE__{load_task: %Task{ref: ref}}) do
    Logger.error(fn ->
      "Error loading gtfs, time_in_ms=#{time / 1000}"
    end)

    {:stop, error}
  end

  def handle_info(
        {:DOWN, ref, :process, _pid, :normal},
        %__MODULE__{load_task: %Task{ref: ref}} = state
      ) do
    {:noreply, %{state | load_task: nil}}
  end

  # Initialization (Client)

  @spec start_link(String.t()) :: GenServer.on_start()
  def start_link(url) do
    GenServer.start_link(
      __MODULE__,
      {{:url, url}, HealthServer.default_server()},
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
    {:ok,
     %__MODULE__{
       loaded?: false,
       load_task: nil,
       health_server_pid: health_server_pid
     }, {:continue, {:load_gtfs, files_source}}}
  end

  @impl true
  def handle_continue({:load_gtfs, files_source}, %__MODULE__{loaded?: false} = state) do
    load_task =
      Task.async(fn ->
        :timer.tc(__MODULE__, :fetch_gtfs, [files_source])
      end)

    {:noreply, %{state | load_task: load_task}}
  end

  @spec fetch_gtfs(files_source()) :: {:ok, Data.t()} | {:error, any()}
  def fetch_gtfs({:mocked_files, mocked_files}) do
    data =
      mocked_files
      |> files_from_mocked()
      |> Data.parse_files()

    {:ok, data}
  end

  def fetch_gtfs({:url, url}) do
    if CacheFile.should_use_file?() do
      Logger.info("Loading gfts data from cached file")

      with {:ok, data} <- CacheFile.load_gtfs() do
        {:ok, data}
      else
        _ ->
          with {:ok, data} <- gtfs_from_url(url) do
            CacheFile.save_gtfs(data)
            {:ok, data}
          else
            {:error, error} ->
              {:error, error}
          end
      end
    else
      gtfs_from_url(url)
    end
  end

  @spec gtfs_from_url(String.t()) :: {:ok, Data.t()} | {:error, any()}
  defp gtfs_from_url(url) do
    Logger.info("Loading gtfs data remote files")

    with {:files, files} <- fetch_remote_files(url) do
      data = Data.parse_files(files)
      {:ok, data}
    else
      {:error, error} ->
        {:error, error}
    end
  end

  @spec fetch_remote_files(String.t()) :: {:files, Data.files()} | {:error, any()}
  defp fetch_remote_files(url) do
    case fetch_url(url) do
      {:ok, %HTTPoison.Response{status_code: 200, body: zip_binary}} ->
        file_list = [
          "calendar.txt",
          "calendar_dates.txt",
          "directions.txt",
          "routes.txt",
          "route_patterns.txt",
          "stop_times.txt",
          "stops.txt",
          "trips.txt"
        ]

        unzipped_files = unzip_files(zip_binary, file_list)
        {:files, unzipped_files}

      response ->
        Logger.warn(fn -> "Unexpected response from #{url} : #{inspect(response)}" end)
        {:error, response}
    end
  end

  @spec fetch_url(String.t()) :: {:ok, HTTPoison.Response.t()} | {:error, HTTPoison.Error.t()}
  def fetch_url(url), do: HTTPoison.get(url)

  @spec files_from_mocked(mocked_files()) :: Data.files()
  defp files_from_mocked(mocked_files) do
    for {file_name, lines} <- mocked_files, into: %{} do
      {file_name, Enum.join(lines, "\n")}
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
