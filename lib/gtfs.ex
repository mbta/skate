defmodule Gtfs do
  use GenServer
  require Logger

  alias Gtfs.HealthServer
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
    |> Enum.map(fn trip_id -> Map.get(gtfs_data.trip_timepoints, trip_id, []) end)
    |> Helpers.merge_lists()
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

  @spec start_mocked(mocked_files, pid() | nil) :: pid()
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

    case fetch_files(files_source) do
      {:error, error} ->
        Logger.info(fn ->
          "Error loading gtfs, time_in_ms=#{Time.diff(Time.utc_now(), start_time, :millisecond)}"
        end)

        {:stop, error}

      files ->
        data = parse_files(files)
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
    bus_routes = parse_csv(files["routes.txt"], &Route.bus_route?/1, &Route.from_csv_row/1)
    bus_route_ids = MapSet.new(bus_routes, & &1.id)

    bus_route_patterns =
      parse_csv(
        files["route_patterns.txt"],
        &RoutePattern.in_id_set?(&1, bus_route_ids),
        &RoutePattern.from_csv_row/1
      )

    bus_trips =
      parse_csv(
        files["trips.txt"],
        &Trip.in_id_set?(&1, bus_route_ids),
        &Trip.from_csv_row/1
      )

    bus_trip_ids = MapSet.new(bus_trips, & &1.id)

    bus_trip_timepoints =
      files["stop_times.txt"]
      |> parse_csv(&Timepoint.includes_a_checkpoint_and_in_id_set?(&1, bus_trip_ids))
      |> trip_timepoints_from_csv()

    all_stops = parse_csv(files["stops.txt"], fn _row -> true end, &Stop.from_csv_row/1)

    %__MODULE__{
      routes: bus_routes,
      route_patterns: bus_route_patterns,
      stops: all_stops,
      trip_timepoints: bus_trip_timepoints,
      trips: bus_trips
    }
  end

  @doc """
  Takes binary csv data, a function to filter each row, and a function to parse each row, and returns the list of results.
  The rows will be passed to the parser as maps with string keys and values.
  e.g. %{"col1" => "1", "col2" => "x"}

  iex> Gtfs.parse_csv("col1,col2\\n1,x\\n2,y\\n3,z", fn row -> row["col2"] != "y" end, fn row -> String.to_integer(row["col1"]) end)
  [1, 3]

  exposed for testing
  """
  @spec parse_csv(
          binary() | nil,
          (%{required(String.t()) => String.t()} -> boolean),
          (%{required(String.t()) => String.t()} -> row_struct)
        ) ::
          [row_struct]
        when row_struct: var
  def parse_csv(file_binary, row_filter, row_decoder \\ & &1)

  def parse_csv(nil, _row_filter, _row_decoder) do
    []
  end

  def parse_csv(file_binary, row_filter, row_decoder) do
    {:ok, file_stream} =
      file_binary
      |> StringIO.open()

    file_stream
    |> IO.binstream(:line)
    |> CSV.decode(headers: true)
    |> Stream.flat_map(fn {:ok, csv_row} ->
      if row_filter.(csv_row) do
        [row_decoder.(csv_row)]
      else
        []
      end
    end)
    |> Enum.to_list()
  end

  @spec trip_timepoints_from_csv([%{optional(String.t()) => String.t()}]) ::
          %{optional(Trip.id()) => Timepoint.id()}
  defp trip_timepoints_from_csv(stop_times_csv) do
    stop_times_csv
    |> Enum.group_by(fn stop_time_row -> stop_time_row["trip_id"] end)
    |> Helpers.map_values(fn stop_times_on_trip ->
      stop_times_on_trip
      |> Enum.sort_by(fn stop_time_row -> stop_time_row["stop_sequence"] end)
      |> Enum.map(fn stop_time_row -> stop_time_row["checkpoint_id"] end)
    end)
  end
end
