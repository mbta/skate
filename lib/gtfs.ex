defmodule Gtfs do
  use GenServer
  require Logger

  alias Gtfs.Helpers

  alias Gtfs.Route
  alias Gtfs.RoutePattern
  alias Gtfs.Stop
  alias Gtfs.Timepoint
  alias Gtfs.Trip

  @type t :: %__MODULE__{
          routes: [Route.t()],
          route_patterns: [RoutePattern.t()],
          stops: [Stop.t()],
          trip_timepoints: %{optional(Trip.id()) => [Timepoint.id()]},
          trips: [Trip.t()]
        }

  @enforce_keys [
    :routes,
    :route_patterns,
    :stops,
    :trip_timepoints,
    :trips
  ]

  defstruct [
    :routes,
    :route_patterns,
    :stops,
    :trip_timepoints,
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

  @spec all_routes(GenServer.server() | nil) :: [Route.t()]
  def all_routes(server \\ nil) do
    server = server || __MODULE__
    GenServer.call(server, :all_routes)
  end

  @spec timepoints_on_route(Route.id(), GenServer.server() | nil) :: [Timepoint.id()]
  def timepoints_on_route(route_id, server \\ nil) do
    server = server || __MODULE__
    GenServer.call(server, {:timepoints_on_route, route_id})
  end

  # Queries (Server)

  @impl true
  def handle_call(:all_routes, _from, {:loaded, gtfs_data} = state) do
    {:reply, gtfs_data.routes, state}
  end

  def handle_call({:timepoints_on_route, route_id}, _from, {:loaded, gtfs_data} = state) do
    route_patterns_by_direction =
      gtfs_data.route_patterns
      |> Enum.filter(fn route_pattern -> route_pattern.route_id == route_id end)
      |> Enum.group_by(fn route_pattern -> route_pattern.direction_id end)

    timepoints_by_direction =
      Helpers.map_values(route_patterns_by_direction, fn route_patterns ->
        timepoints_for_route_patterns(route_patterns, gtfs_data)
      end)

    merged_timepoint_ids =
      Helpers.merge_lists([
        Enum.reverse(Map.get(timepoints_by_direction, 0, [])),
        Map.get(timepoints_by_direction, 1, [])
      ])

    {:reply, merged_timepoint_ids, state}
  end

  # All route_patterns should be in the same direction
  @spec timepoints_for_route_patterns([RoutePattern.t()], t()) :: [Timepoint.id()]
  defp timepoints_for_route_patterns(route_patterns, gtfs_data) do
    route_patterns
    |> Enum.map(fn route_pattern -> route_pattern.representative_trip_id end)
    |> Enum.map(fn trip_id -> gtfs_data.trip_timepoints[trip_id] end)
    |> Helpers.merge_lists()
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
          "route_patterns.txt",
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
      route_patterns: parse_csv(files["route_patterns.txt"], &RoutePattern.from_csv_row/1),
      stops: parse_csv(files["stops.txt"], &Stop.from_csv_row/1),
      trip_timepoints:
        files["stop_times.txt"]
        |> parse_csv()
        |> trip_timepoints_from_csv(),
      trips: parse_csv(files["trips.txt"], &Trip.from_csv_row/1)
    }
  end

  @spec trip_timepoints_from_csv([%{optional(String.t()) => String.t()}]) ::
          %{optional(Trip.id()) => Timepoint.id()}
  defp trip_timepoints_from_csv(stop_times_csv) do
    stop_times_csv
    |> Enum.filter(fn stop_time_row -> stop_time_row["checkpoint_id"] != "" end)
    |> Enum.group_by(fn stop_time_row -> stop_time_row["trip_id"] end)
    |> Helpers.map_values(fn stop_times_on_trip ->
      stop_times_on_trip
      |> Enum.sort_by(fn stop_time_row -> stop_time_row["stop_sequence"] end)
      |> Enum.map(fn stop_time_row -> stop_time_row["checkpoint_id"] end)
    end)
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
  def parse_csv(file_binary, row_decoder \\ & &1)

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
