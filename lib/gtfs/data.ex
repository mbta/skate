defmodule Gtfs.Data do
  @moduledoc """
  GTFS Data management
  """
  require Logger

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
  @type trip_timepoints :: %{Trip.id() => [Timepoint.t()]}

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

  @spec all_routes(t()) :: [Route.t()]
  def all_routes(%__MODULE__{routes: routes}), do: routes

  @spec timepoints_on_route(t(), Route.id()) :: [Timepoint.t()]
  def timepoints_on_route(%__MODULE__{} = data, route_id),
    do: items_on_route(data, route_id, &timepoints_for_route_patterns/2)

  @spec stops_on_route(t(), Route.id()) :: [Stop.id()]
  def stops_on_route(%__MODULE__{} = data, route_id),
    do: items_on_route(data, route_id, &stops_for_route_patterns/2)

  @spec items_on_route(t(), Route.id(), ([RoutePattern.t()], t() -> [item])) :: [item]
        when item: var
  defp items_on_route(
         %__MODULE__{route_patterns: route_patterns} = data,
         route_id,
         items_for_route_patterns_fn
       ) do
    items_by_direction =
      route_patterns
      |> route_patterns_by_direction(route_id)
      |> Helpers.map_values(fn route_patterns ->
        items_for_route_patterns_fn.(route_patterns, data)
      end)

    Helpers.merge_lists([
      items_by_direction |> Map.get(0, []) |> Enum.reverse(),
      Map.get(items_by_direction, 1, [])
    ])
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
  @spec timepoints_for_route_patterns([RoutePattern.t()], t()) :: [Timepoint.t()]
  defp timepoints_for_route_patterns(route_patterns, %__MODULE__{trip_timepoints: trip_timepoints}) do
    route_patterns
    |> Enum.map(fn route_pattern -> route_pattern.representative_trip_id end)
    |> Enum.map(fn trip_id -> Map.get(trip_timepoints, trip_id, []) end)
    |> Helpers.merge_lists()
  end

  # All route_patterns should be in the same direction
  @spec stops_for_route_patterns([RoutePattern.t()], t()) :: [Stop.id()]
  defp stops_for_route_patterns(route_patterns, %__MODULE__{trip_stops: trip_stops}) do
    route_patterns
    |> Enum.map(fn route_pattern -> route_pattern.representative_trip_id end)
    |> Enum.map(fn trip_id -> Map.get(trip_stops, trip_id, []) end)
    |> Helpers.merge_lists()
  end

  @spec parse_files(files()) :: t()
  def parse_files(files) do
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
