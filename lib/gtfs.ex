defmodule Gtfs do
  use GenServer
  require Logger

  alias Gtfs.CacheFile
  alias Gtfs.Data
  alias Gtfs.HealthServer
  alias Gtfs.Route
  alias Gtfs.Stop
  alias Gtfs.StopTime
  alias Gtfs.Trip

  @type state :: :not_loaded | {:loaded, Data.t()}

  @type files_source :: {:url, String.t()} | {:mocked_files, mocked_files()}

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

  @spec all_routes(GenServer.server() | nil) :: [Route.t()]
  def all_routes(server \\ __MODULE__) do
    GenServer.call(server, :all_routes)
  end

  @spec timepoint_ids_on_route(Route.id(), GenServer.server() | nil) :: [StopTime.timepoint_id()]
  def timepoint_ids_on_route(route_id, server \\ __MODULE__) do
    GenServer.call(server, {:timepoint_ids_on_route, route_id})
  end

  @spec stop_times_on_trip(Trip.id(), GenServer.server() | nil) :: [Stop.id()]
  def stop_times_on_trip(trip_id, server \\ __MODULE__) do
    GenServer.call(server, {:stop_times_on_trip, trip_id})
  end

  # Queries (Server)

  @impl true
  def handle_call(:all_routes, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.all_routes(gtfs_data), state}
  end

  def handle_call({:timepoint_ids_on_route, route_id}, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.timepoint_ids_on_route(gtfs_data, route_id), state}
  end

  def handle_call({:stop_times_on_trip, trip_id}, _from, {:loaded, gtfs_data} = state) do
    {:reply, Data.stop_times_on_trip(gtfs_data, trip_id), state}
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
        Logger.info(fn ->
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

  defp fetch_gtfs({:url, url}) do
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
