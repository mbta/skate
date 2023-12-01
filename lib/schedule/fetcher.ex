defmodule Schedule.Fetcher do
  @moduledoc false

  use GenServer, restart: :transient
  require Logger

  alias Schedule.{
    CacheFile,
    Data,
    Health
  }

  @default_opts [
    poll_interval_ms: 5 * 60 * 1_000,
    health_server: Health.Server.default_server(),
    updater_function: &Schedule.update_state/1,
    files_source: :remote
  ]

  @type files_source :: :remote | {:mocked_files, Schedule.mocked_files()}

  @type state :: %{
          poll_interval_ms: integer(),
          health_server: GenServer.server(),
          updater_function: (Schedule.Data.t() -> :ok),
          latest_gtfs_timestamp: String.t() | nil,
          latest_hastus_timestamp: String.t() | nil,
          files_source: files_source()
        }

  @spec start_link(Keyword.t()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    opts = Keyword.merge(@default_opts, opts)
    GenServer.start_link(__MODULE__, opts, name: opts[:name] || __MODULE__)
  end

  @impl true
  def init(opts) do
    initial_state = %{
      poll_interval_ms: opts[:poll_interval_ms],
      health_server: opts[:health_server],
      updater_function: opts[:updater_function],
      latest_gtfs_timestamp: nil,
      latest_hastus_timestamp: nil,
      files_source: opts[:files_source]
    }

    {:ok, initial_state, {:continue, :initial_poll}}
  end

  @impl true
  def handle_continue(:initial_poll, state) do
    do_poll(state, true)
  end

  @impl true
  def handle_info(:check_gtfs, state) do
    do_poll(state, false)
  end

  @spec do_poll(state(), boolean()) :: {:noreply, state()} | {:stop, :normal, state()}
  def do_poll(state, notify_health_server?) do
    start_time = Time.utc_now()

    Logger.info("#{__MODULE__}: Polling for new schedule data")

    case fetch_gtfs(
           state[:files_source],
           state[:latest_gtfs_timestamp],
           state[:latest_hastus_timestamp]
         ) do
      {:ok, data, gtfs_timestamp, hastus_timestamp, continue_polling?} ->
        schedule_state = {:loaded, data}

        update_start_time = Time.utc_now()
        :ok = state[:updater_function].(schedule_state)

        Logger.info(
          "#{__MODULE__}: Sent updated schedule data to receiving process, time_in_ms=#{Time.diff(Time.utc_now(), update_start_time, :millisecond)}"
        )

        Logger.info(
          "#{__MODULE__}: Successfully loaded schedule data, time_in_ms=#{Time.diff(Time.utc_now(), start_time, :millisecond)}"
        )

        if notify_health_server? && state[:health_server] do
          Health.Server.loaded(state[:health_server])
        end

        if continue_polling? do
          Process.send_after(self(), :check_gtfs, state[:poll_interval_ms])

          {:noreply,
           Map.merge(state, %{
             latest_gtfs_timestamp: gtfs_timestamp,
             latest_hastus_timestamp: hastus_timestamp
           }), :hibernate}
        else
          {:stop, :normal, state}
        end

      :no_update ->
        Process.send_after(self(), :check_gtfs, state[:poll_interval_ms])

        {:noreply, state}

      {:error, error} ->
        Process.send_after(self(), :check_gtfs, state[:poll_interval_ms])

        Logger.error(fn ->
          "#{__MODULE__}: Error loading schedule data, time_in_ms=#{Time.diff(Time.utc_now(), start_time, :millisecond)} error=#{inspect(error)}"
        end)

        {:noreply, state}
    end
  end

  @spec fetch_gtfs(files_source(), String.t() | nil, String.t() | nil) ::
          {:ok, Data.t(), String.t() | nil, String.t() | nil, boolean()}
          | :no_update
          | {:error, any()}
  defp fetch_gtfs({:mocked_files, mocked_files}, _latest_gtfs_timestamp, _latest_hastus_timestamp) do
    data =
      mocked_files
      |> files_from_mocked()
      |> Data.parse_files()

    {:ok, data, nil, nil, false}
  end

  defp fetch_gtfs(:remote, latest_gtfs_timestamp, latest_hastus_timestamp) do
    if CacheFile.should_use_file?() do
      Logger.info("#{__MODULE__}: Loading schedule data from cached file")

      case CacheFile.load_gtfs() do
        {:ok, data} ->
          {:ok, data, nil, nil, false}

        _ ->
          case gtfs_from_url(latest_gtfs_timestamp, latest_hastus_timestamp) do
            {:ok, data, gtfs_timestamp, hastus_timestamp, continue_polling?} ->
              CacheFile.save_gtfs(data)
              {:ok, data, gtfs_timestamp, hastus_timestamp, continue_polling?}

            :no_update ->
              :no_update

            {:error, error} ->
              {:error, error}
          end
      end
    else
      gtfs_from_url(latest_gtfs_timestamp, latest_hastus_timestamp)
    end
  end

  @spec gtfs_from_url(String.t() | nil, String.t() | nil) ::
          {:ok, Data.t(), String.t() | nil, String.t() | nil, boolean()}
          | :no_update
          | {:error, any()}
  defp gtfs_from_url(latest_gtfs_timestamp, latest_hastus_timestamp) do
    Logger.info("#{__MODULE__}: Querying schedule data remote files")

    case fetch_remote_files(latest_gtfs_timestamp, latest_hastus_timestamp) do
      {:files, files, gtfs_timestamp, hastus_timestamp} ->
        Logger.info("#{__MODULE__}: Updated schedule data found, parsing")

        try do
          data = Data.parse_files(files)
          {:ok, data, gtfs_timestamp, hastus_timestamp, true}
        rescue
          error -> {:error, error}
        end

      :no_update ->
        :no_update

      {:error, error} ->
        {:error, error}
    end
  end

  @spec fetch_remote_files(String.t() | nil, String.t() | nil) ::
          {:files, Data.all_files(), String.t() | nil, String.t() | nil}
          | :no_update
          | {:error, any()}
  def fetch_remote_files(latest_gtfs_timestamp, latest_hastus_timestamp) do
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

    with {:ok, hastus_files, hastus_timestamp} <-
           fetch_zip(hastus_url, hastus_file_names, latest_hastus_timestamp),
         {:ok, gtfs_files, gtfs_timestamp} <-
           fetch_zip(gtfs_url, gtfs_file_names, latest_gtfs_timestamp) do
      if hastus_files || gtfs_files do
        with {:ok, hastus_files, hastus_timestamp} <-
               (if hastus_files do
                  {:ok, hastus_files, hastus_timestamp}
                else
                  fetch_zip(hastus_url, hastus_file_names, nil)
                end),
             {:ok, gtfs_files, gtfs_timestamp} <-
               (if gtfs_files do
                  {:ok, gtfs_files, gtfs_timestamp}
                else
                  fetch_zip(gtfs_url, gtfs_file_names, nil)
                end) do
          {:files,
           %{
             gtfs: gtfs_files,
             hastus: hastus_files,
             version: "#{gtfs_timestamp}_#{hastus_timestamp}"
           }, gtfs_timestamp, hastus_timestamp}
        else
          {:error, error} -> {:error, error}
        end
      else
        :no_update
      end
    else
      {:error, error} ->
        {:error, error}
    end
  end

  @spec fetch_zip(String.t(), [String.t()], String.t() | nil) ::
          {:ok, Data.files() | nil, String.t() | nil} | {:error, any()}
  def fetch_zip(url, file_names, latest_timestamp) do
    request_headers =
      if is_nil(latest_timestamp) do
        []
      else
        [{"if-modified-since", latest_timestamp}]
      end

    case HTTPoison.get(
           url,
           request_headers
         ) do
      {:ok, %HTTPoison.Response{status_code: 200, body: zip_binary, headers: headers}} ->
        last_modified = last_modified_from_headers(headers)

        unzipped_files = unzip_files(zip_binary, file_names)
        {:ok, unzipped_files, last_modified}

      {:ok, %HTTPoison.Response{status_code: 304, headers: headers}} ->
        last_modified = last_modified_from_headers(headers)

        {:ok, nil, last_modified}

      response ->
        Logger.warn(fn ->
          "#{__MODULE__}: Unexpected response from #{url} : #{inspect(response)}"
        end)

        {:error, response}
    end
  end

  @spec files_from_mocked(Schedule.mocked_files()) :: Data.all_files()
  defp files_from_mocked(mocked_files) do
    for key <- [:gtfs, :hastus], into: %{version: "mocked_version"} do
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

  @spec last_modified_from_headers(HTTPoison.headers()) :: String.t() | nil
  defp last_modified_from_headers(headers) do
    Enum.find_value(headers, fn {header, value} ->
      if String.downcase(header) == "last-modified" do
        value
      end
    end)
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
