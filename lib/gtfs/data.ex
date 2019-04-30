defmodule Gtfs.Data do
  @moduledoc """
  GTFS Data management
  """
  require Logger

  alias Gtfs.CacheFile
  alias Gtfs.Csv
  alias Gtfs.Direction
  alias Gtfs.Helpers
  alias Gtfs.Route
  alias Gtfs.RoutePattern
  alias Gtfs.Stop
  alias Gtfs.StopTime
  alias Gtfs.Timepoint
  alias Gtfs.Trip

  @type t :: %__MODULE__{
          routes: [Route.t()],
          route_patterns: [RoutePattern.t()],
          stops: [Stop.t()],
          trip_stops: trip_stops(),
          trip_timepoints: trip_timepoints,
          trips: [Trip.t()]
        }

  @type trip_stops :: %{Trip.id() => [Stop.id()]}

  @type trip_timepoints :: %{Trip.id() => [Timepoint.id()]}

  @enforce_keys [
    :routes,
    :route_patterns,
    :stops,
    :trip_stops,
    :trip_timepoints,
    :trips
  ]

  defstruct [
    :routes,
    :route_patterns,
    :stops,
    :trip_stops,
    :trip_timepoints,
    :trips
  ]

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

  @spec all_routes(t()) :: [Route.t()]
  def all_routes(%__MODULE__{routes: routes}), do: routes

  @spec timepoints_on_route(t(), Route.id()) :: [Timepoint.id()]
  def timepoints_on_route(
        %__MODULE__{route_patterns: route_patterns, trip_timepoints: trip_timepoints},
        route_id
      ) do
    route_patterns_by_direction = route_patterns_by_direction(route_patterns, route_id)

    timepoints_by_direction =
      Helpers.map_values(route_patterns_by_direction, fn route_patterns ->
        timepoints_for_route_patterns(route_patterns, trip_timepoints)
      end)

    merged_timepoint_ids =
      Helpers.merge_lists([
        timepoints_by_direction |> Map.get(0, []) |> Enum.reverse(),
        Map.get(timepoints_by_direction, 1, [])
      ])

    merged_timepoint_ids
  end

  @spec stops_on_route(t(), Route.id()) :: [Stop.id()]
  def stops_on_route(
        %__MODULE__{route_patterns: route_patterns, trip_stops: trip_stops},
        route_id
      ) do
    route_patterns_by_direction = route_patterns_by_direction(route_patterns, route_id)

    stops_by_direction =
      Helpers.map_values(route_patterns_by_direction, fn route_patterns ->
        stops_for_route_patterns(route_patterns, trip_stops)
      end)

    merged_stop_ids =
      Helpers.merge_lists([
        stops_by_direction |> Map.get(0, []) |> Enum.reverse(),
        Map.get(stops_by_direction, 1, [])
      ])

    merged_stop_ids
  end

  @spec fetch_gtfs(files_source()) :: {:ok, t()} | {:error, any()}
  def fetch_gtfs({:mocked_files, mocked_files}) do
    data =
      mocked_files
      |> files_from_mocked()
      |> parse_files()

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

  @spec route_patterns_by_direction([RoutePattern.t()], Route.id()) :: %{
          Direction.id() => [RoutePattern.t()]
        }
  defp route_patterns_by_direction(route_patterns, route_id) do
    route_patterns
    |> RoutePattern.for_route_id(route_id)
    |> RoutePattern.by_direction()
  end

  # All route_patterns should be in the same direction
  @spec timepoints_for_route_patterns([RoutePattern.t()], trip_timepoints()) :: [
          Timepoint.id()
        ]
  defp timepoints_for_route_patterns(route_patterns, trip_timepoints) do
    route_patterns
    |> Enum.map(fn route_pattern -> route_pattern.representative_trip_id end)
    |> Enum.map(fn trip_id -> Map.get(trip_timepoints, trip_id, []) end)
    |> Helpers.merge_lists()
  end

  # All route_patterns should be in the same direction
  @spec stops_for_route_patterns([RoutePattern.t()], trip_stops()) :: [Stop.id()]
  defp stops_for_route_patterns(route_patterns, trip_stops) do
    route_patterns
    |> Enum.map(fn route_pattern -> route_pattern.representative_trip_id end)
    |> Enum.map(fn trip_id -> Map.get(trip_stops, trip_id, []) end)
    |> Helpers.merge_lists()
  end

  @spec gtfs_from_url(String.t()) :: {:ok, t()} | {:error, any()}
  defp gtfs_from_url(url) do
    Logger.info("Loading gtfs data remote files")

    with {:files, files} <- fetch_remote_files(url) do
      data = parse_files(files)
      {:ok, data}
    else
      {:error, error} ->
        {:error, error}
    end
  end

  @spec fetch_remote_files(String.t()) :: {:files, files()} | {:error, any()}
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

  @spec files_from_mocked(mocked_files()) :: files()
  defp files_from_mocked(mocked_files) do
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
    bus_routes = Csv.parse(files["routes.txt"], &Route.bus_route_row?/1, &Route.from_csv_row/1)
    bus_route_ids = MapSet.new(bus_routes, & &1.id)

    bus_trips = bus_trips(files["trips.txt"], bus_route_ids)
    bus_trip_ids = MapSet.new(bus_trips, & &1.id)

    %__MODULE__{
      routes: bus_routes,
      route_patterns: bus_route_patterns(files["route_patterns.txt"], bus_route_ids),
      stops: all_stops(files["stops.txt"]),
      trip_stops: bus_trip_stops(files["stop_times.txt"], bus_trip_ids),
      trip_timepoints: bus_trip_timepoints(files["stop_times.txt"], bus_trip_ids),
      trips: bus_trips
    }
  end

  @spec bus_trips(binary(), MapSet.t(Route.id())) :: [Trip.t()]
  defp bus_trips(trips_data, bus_route_ids) do
    Csv.parse(
      trips_data,
      &Trip.row_in_route_id_set?(&1, bus_route_ids),
      &Trip.from_csv_row/1
    )
  end

  @spec bus_route_patterns(binary(), MapSet.t(Route.id())) :: [RoutePattern.t()]
  defp bus_route_patterns(route_patterns_data, bus_route_ids) do
    Csv.parse(
      route_patterns_data,
      &RoutePattern.row_in_route_id_set?(&1, bus_route_ids),
      &RoutePattern.from_csv_row/1
    )
  end

  @spec all_stops(binary()) :: [Stop.t()]
  defp all_stops(stops_data), do: Csv.parse(stops_data, fn _row -> true end, &Stop.from_csv_row/1)

  @spec bus_trip_stops(binary(), MapSet.t(Trip.id())) :: trip_stops()
  defp bus_trip_stops(stop_times_data, bus_trip_ids) do
    stop_times_data
    |> Csv.parse(&StopTime.row_in_trip_id_set?(&1, bus_trip_ids))
    |> StopTime.trip_stops_from_csv()
  end

  @spec bus_trip_timepoints(binary(), MapSet.t(Trip.id())) :: trip_timepoints()
  defp bus_trip_timepoints(stop_times_data, bus_trip_ids) do
    stop_times_data
    |> Csv.parse([
      &StopTime.row_includes_a_checkpoint?(&1),
      &StopTime.row_in_trip_id_set?(&1, bus_trip_ids)
    ])
    |> StopTime.trip_timepoints_from_csv()
  end
end
