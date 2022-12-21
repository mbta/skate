defmodule Schedule.Gtfs.Stop do
  alias Schedule.Csv
  alias Schedule.Gtfs.{Route, RoutePattern, StopTime}

  @type id :: String.t()

  @type location_type() :: :stop | :station

  @type t :: %__MODULE__{
          id: id(),
          name: String.t(),
          parent_station_id: id() | nil,
          latitude: float() | nil,
          longitude: float() | nil,
          connections: [Route.t()],
          location_type: location_type()
        }
  @type by_id :: %{id() => t()}

  @enforce_keys [
    :id,
    :name
  ]

  defstruct [
    :id,
    :name,
    :parent_station_id,
    :latitude,
    :longitude,
    connections: [],
    location_type: :stop
  ]

  defimpl Jason.Encoder do
    def encode(stop, opts) do
      %{latitude: latitude, longitude: longitude} = stop

      stop
      |> Map.from_struct()
      |> Map.drop([:latitude, :longitude, :parent_station_id])
      |> Map.merge(%{lat: latitude, lon: longitude})
      |> Jason.Encode.map(opts)
    end
  end

  @location_type_map %{nil => :stop, "" => :stop, "0" => :stop, "1" => :station}

  @doc """
  Parse a CSV of stops, including only records that have a location type of stop/platform or stations
  (omitting enterance/exits, generic nodes, and boarding areas)
  """
  @spec parse(binary() | nil) :: [t()]
  def parse(file_binary) do
    file_binary
    |> Csv.parse(
      parse: &from_csv_row/1,
      filter: fn row -> Map.has_key?(@location_type_map, row["location_type"]) end
    )
  end

  @spec parent_station_id(t() | nil) :: id() | nil
  def parent_station_id(nil), do: nil
  def parent_station_id(%__MODULE__{id: id, parent_station_id: nil}), do: id
  def parent_station_id(%__MODULE__{parent_station_id: parent_station_id}), do: parent_station_id

  @spec from_csv_row(Csv.row()) :: t()
  def from_csv_row(row) do
    parent_station_id = if row["parent_station"] == "", do: nil, else: row["parent_station"]

    %__MODULE__{
      id: row["stop_id"],
      name: row["stop_name"],
      parent_station_id: parent_station_id,
      latitude: parse_lat_lon(row["stop_lat"]),
      longitude: parse_lat_lon(row["stop_lon"]),
      location_type: Map.fetch!(@location_type_map, row["location_type"])
    }
  end

  @doc """
  Returns true when the stop is a station.
  """
  @spec is_station?(t()) :: boolean()
  def is_station?(stop), do: stop.location_type == 1

  @doc """
  Remove any stop connections with the given route_id
  """
  @spec reject_connections_for_route(t(), Route.id()) :: t()
  def reject_connections_for_route(stop, route_id) do
    %{stop | connections: Enum.reject(stop.connections, &(&1.id == route_id))}
  end

  @doc """
  Add connections to a map of stops by id based on the given route, pattern, and stop time data.
  The list of connections for a stop will include connections for all sibling and parent stops.
  """
  @spec stops_with_connections(by_id(), [Route.t()], [RoutePattern.t()], StopTime.by_trip_id()) ::
          by_id()
  def stops_with_connections(stops_by_id, routes, route_patterns, stop_times_by_trip_id) do
    routes_by_id = Map.new(routes, &{&1.id, &1})

    connections_by_parent_or_stop_id =
      route_patterns
      |> Enum.reduce(%{}, fn route_pattern, acc_stop_id_to_routes ->
        route_pattern
        |> parent_or_stop_id_to_routes_for_pattern(
          routes_by_id,
          stop_times_by_trip_id,
          stops_by_id
        )
        |> Map.merge(acc_stop_id_to_routes, fn _stop_id, new_routes, acc_routes ->
          MapSet.union(acc_routes, new_routes)
        end)
      end)

    stops_with_connections(stops_by_id, connections_by_parent_or_stop_id)
  end

  @spec stops_with_connections(by_id(), %{id() => MapSet.t(Route.t())}) :: by_id()
  defp stops_with_connections(stops_by_id, connections_by_parent_or_stop_id) do
    Map.new(stops_by_id, fn {stop_id, stop} ->
      {
        stop_id,
        %{
          stop
          | connections:
              connections_by_parent_or_stop_id
              |> Map.get(stop_id_for_route_association(stop), MapSet.new())
              |> MapSet.to_list()
        }
      }
    end)
  end

  @spec parent_or_stop_id_to_routes_for_pattern(
          RoutePattern.t(),
          %{Route.id() => Route.t()},
          StopTime.by_trip_id(),
          by_id()
        ) :: %{id() => MapSet.t(Route.t())}
  defp parent_or_stop_id_to_routes_for_pattern(
         route_pattern,
         routes_by_id,
         stop_times_by_trip_id,
         stops_by_id
       ) do
    case Map.get(routes_by_id, route_pattern.route_id) do
      nil ->
        %{}

      route ->
        stop_times_by_trip_id
        |> Map.get(route_pattern.representative_trip_id, [])
        # For child stops, associate all routes with the parent stop to easily get all connections for a family of stops.
        |> Map.new(fn stop_time ->
          {stop_id_for_route_association(stop_time.stop_id, stops_by_id), MapSet.new([route])}
        end)
    end
  end

  @spec stop_id_for_route_association(t()) :: id()
  defp stop_id_for_route_association(stop) do
    stop.parent_station_id || stop.id
  end

  @spec stop_id_for_route_association(id(), by_id()) :: id()
  defp stop_id_for_route_association(stop_id, stops_by_id) do
    case Map.get(stops_by_id, stop_id) do
      nil -> stop_id
      %{parent_station_id: nil} -> stop_id
      %{parent_station_id: parent_id} -> parent_id
    end
  end

  @spec parse_lat_lon(String.t()) :: float() | nil
  defp parse_lat_lon(""), do: nil
  defp parse_lat_lon(s), do: String.to_float(s)
end
