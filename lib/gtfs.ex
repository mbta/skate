defmodule Gtfs do
  use GenServer
  require Logger

  alias Gtfs.Route
  alias Gtfs.Stop
  alias Gtfs.StopTime
  alias Gtfs.Trip

  @type t :: %__MODULE__{
          routes: [Route.t()],
          stops: [Stop.t()],
          stop_times: [StopTime.t()],
          trips: [Trip.t()]
        }

  @enforce_keys [
    :routes,
    :stops,
    :stop_times,
    :trips
  ]

  defstruct [
    :routes,
    :stops,
    :stop_times,
    :trips
  ]

  @type state :: :not_loaded | {:loaded, t()}

  @type files :: %{optional(String.t()) => binary()}

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

  @doc """
  exposed for testing
  """
  @spec state(GenServer.server()) :: state()
  def state(server) do
    GenServer.call(server, :state)
  end

  @spec all_routes(GenServer.server() | nil) :: [Route.t()]
  def all_routes(server \\ nil) do
    server = server || __MODULE__
    GenServer.call(server, :all_routes)
  end

  # Queries (Server)

  @impl true
  def handle_call(:state, _from, state) do
    {:reply, state, state}
  end

  def handle_call(:all_routes, _from, {:loaded, gtfs_data} = state) do
    {:reply, gtfs_data.routes, state}
  end

  # Initialization (Client)

  @spec start_link(String.t()) :: GenServer.on_start()
  def start_link(url) do
    GenServer.start_link(__MODULE__, {:url, url}, name: __MODULE__)
  end

  @spec start_mocked(mocked_files) :: GenServer.on_start()
  def start_mocked(mocked_files) do
    GenServer.start_link(__MODULE__, {:mocked_files, mocked_files})
  end

  # Initialization (Server)

  @impl true
  def init(files_source) do
    {:ok, :not_loaded, {:continue, {:load_gtfs, files_source}}}
  end

  @impl true
  def handle_continue({:load_gtfs, files_source}, :not_loaded) do
    case fetch_files(files_source) do
      {:error, error} ->
        {:stop, error}

      files ->
        data = parse_files(files)
        state = {:loaded, data}
        Logger.info(fn -> "Successfully loaded gtfs" end)
        {:noreply, state}
    end
  end

  @spec fetch_files(files_source()) :: files() | {:error, any()}
  defp fetch_files({:url, url}) do
    case HTTPoison.get(url) do
      {:ok, %HTTPoison.Response{status_code: 200, body: zip_binary}} ->
        file_list = [
          "routes.txt",
          "stop_times.txt",
          "stops.txt",
          "trips.txt"
        ]

        unzip_files(zip_binary, file_list)

      response ->
        Logger.warn(fn -> "Unexpected response from #{url} : #{inspect(response)}" end)
        {:error, response}
    end
  end

  defp fetch_files({:mocked_files, mocked_files}) do
    for {file_name, lines} <- mocked_files, into: %{} do
      {file_name, Enum.join(lines, "\n")}
    end
  end

  # Takes in the binary data of a zip file, and a list of files to extract
  # Returns a map from those file names to the data in each file
  @spec unzip_files(binary(), [String.t()]) :: files()
  defp unzip_files(zip_binary, file_names) do
    # erlang needs file names as charlists.
    file_names = Enum.map(file_names, &String.to_charlist/1)
    {:ok, unzipped_files} = :zip.unzip(zip_binary, [{:file_list, file_names}, :memory])

    unzipped_files
    # Convert filenames back from charlists to strings
    |> Enum.map(fn {file_name, data} -> {to_string(file_name), data} end)
    |> Map.new()
  end

  @spec parse_files(files()) :: t()
  defp parse_files(files) do
    %__MODULE__{
      routes: parse_csv(files["routes.txt"], &Route.from_csv_row/1),
      stops: parse_csv(files["stops.txt"], &Stop.from_csv_row/1),
      stop_times: parse_csv(files["stop_times.txt"], &StopTime.from_csv_row/1),
      trips: parse_csv(files["trips.txt"], &Trip.from_csv_row/1)
    }
  end

  @doc """
  Takes binary csv data, and a function to parse each row, and returns the list of results
  The rows will be passed to the parser as maps with string keys and values.
  e.g. %{"col1" => "1", "col2" => "x"}

  iex> Gtfs.parse_csv("col1,col2\\n1,x\\n2,y", fn row -> String.to_integer(row["col1"]) end)
  [1, 2]

  exposed for testing
  """
  @spec parse_csv(binary() | nil, (%{required(String.t()) => String.t()} -> row_struct)) ::
          [row_struct]
        when row_struct: var
  def parse_csv(nil, _row_decoder) do
    []
  end

  def parse_csv(file_binary, row_decoder) do
    {:ok, file_stream} =
      file_binary
      |> StringIO.open()

    file_stream
    |> IO.binstream(:line)
    |> CSV.decode(headers: true)
    |> Enum.map(fn {:ok, row} -> row_decoder.(row) end)
  end
end
