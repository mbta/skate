defmodule Schedule.Gtfs.Fetcher do
  use GenServer
  require Logger

  alias Schedule.{
    CacheFile,
    Data,
    Health
  }

  @default_opts [
    poll_interval_ms: 60 * 60 * 1_000,
    health_server: Health.Server.default_server(),
    updater_function: &Schedule.update_state/1,
    files_source: :remote
  ]

  @type state :: %{
          poll_interval_ms: integer(),
          health_server: GenServer.server(),
          updater_function: (Schedule.Data.t() -> :ok),
          latest_gtfs_timestamp: String.t() | nil,
          latest_hastus_timestamp: String.t() | nil
        }

  @spec start_link(Keyword.t()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    opts = Keyword.merge(opts, @default_opts)
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(opts) do
    initial_state = %{
      poll_interval_ms: opts[:poll_interval_ms],
      health_server: opts[:health_server],
      updater_function: opts[:updater_function],
      latest_gtfs_timestamp: nil,
      latest_hastus_timestamp: nil
    }

    {:ok, initial_state, {:continue, {:initial_poll, opts[:files_source]}}}
  end

  @impl true
  def handle_continue({:initial_poll, files_source}, state) do
    start_time = Time.utc_now()

    with {:ok, data, gtfs_timestamp, hastus_timestamp, continue_polling?} <-
           fetch_gtfs(
             files_source,
             state[:latest_gtfs_timestamp],
             state[:latest_hastus_timestamp]
           ) do
      schedule_state = {:loaded, data}

      :ok = state[:updater_function].(schedule_state)

      Logger.info(
        "Successfully loaded gtfs, time_in_ms=#{
          Time.diff(Time.utc_now(), start_time, :millisecond)
        }"
      )

      if state[:health_server] do
        Health.Server.loaded(state[:health_server])
      end

      if continue_polling? do
        Process.send_after(self(), :check_gtfs, state[:poll_interval_ms])

        {:noreply,
         Map.merge(state, %{
           latest_gtfs_timestamp: gtfs_timestamp,
           lastest_hastus_timestamp: hastus_timestamp
         })}
      else
        {:stop, :normal, state}
      end
    else
      {:error, error} ->
        Logger.error(fn ->
          "Error loading gtfs, time_in_ms=#{Time.diff(Time.utc_now(), start_time, :millisecond)}"
        end)

        {:stop, error, []}
    end
  end

  @impl true
  def handle_cast(:check_gtfs, state) do
    {:noreply, state}
  end

  @spec fetch_gtfs(Schedule.files_source(), String.t() | nil, String.t() | nil) ::
          {:ok, Data.t(), String.t() | nil, String.t() | nil, boolean()} | {:error, any()}
  defp fetch_gtfs({:mocked_files, mocked_files}, _latest_gtfs_timestamp, _latest_hastus_timestamp) do
    data =
      mocked_files
      |> files_from_mocked()
      |> Data.parse_files()

    {:ok, data, nil, nil, false}
  end

  defp fetch_gtfs(:remote, latest_gtfs_timestamp, latest_hastus_timestamp) do
    if CacheFile.should_use_file?() do
      Logger.info("Loading gfts data from cached file")

      with {:ok, data} <- CacheFile.load_gtfs() do
        {:ok, data, nil, false}
      else
        _ ->
          with {:ok, data, gtfs_timestamp, hastus_timestamp, continue_polling?} <-
                 gtfs_from_url(latest_gtfs_timestamp, latest_hastus_timestamp) do
            CacheFile.save_gtfs(data)
            {:ok, data, gtfs_timestamp, hastus_timestamp, continue_polling?}
          else
            {:error, error} ->
              {:error, error}
          end
      end
    else
      gtfs_from_url(latest_gtfs_timestamp, latest_hastus_timestamp)
    end
  end

  @spec gtfs_from_url(String.t() | nil, String.t() | nil) ::
          {:ok, Data.t(), String.t() | nil, String.t() | nil, boolean()} | {:error, any()}
  defp gtfs_from_url(latest_gtfs_timestamp, latest_hastus_timestamp) do
    Logger.info("Loading gtfs data remote files")

    with {:files, files} <- fetch_remote_files(latest_gtfs_timestamp, latest_hastus_timestamp) do
      data = Data.parse_files(files)
      {:ok, data, nil, nil, true}
    else
      {:error, error} ->
        {:error, error}
    end
  end

  @spec fetch_remote_files(String.t() | nil, String.t() | nil) ::
          {:files, Data.all_files()} | {:error, any()}
  def fetch_remote_files(_latest_gtfs_timestamp, _latest_hastus_timestamp) do
    gtfs_url = Application.get_env(:skate, :gtfs_url)
    hastus_url = Application.get_env(:skate, :hastus_url)

    gtfs_file_names = [
      "calendar.txt",
      "calendar_dates.txt",
      "checkpoints.txt",
      "directions.txt",
      "feed_info.txt",
      "routes.txt",
      "route_patterns.txt",
      "shapes.txt",
      "stop_times.txt",
      "stops.txt",
      "trips.txt"
    ]

    hastus_file_names = [
      "activities.csv",
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

  @spec files_from_mocked(Schedule.mocked_files()) :: Data.all_files()
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
