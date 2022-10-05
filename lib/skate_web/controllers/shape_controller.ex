defmodule SkateWeb.ShapeController do
  use SkateWeb, :controller

  # TODO bulk fetch for multiple routes
  @spec route(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def route(conn, %{"route_id" => route_id}) do
    shapes_fn =
      Application.get_env(
        :skate_web,
        :shapes_fn,
        &Schedule.shapes_with_stops_for_route/1
      )

    shapes =
      route_id
      |> shapes_fn.()
      |> Enum.map(&format_stops(&1))

    json(conn, %{data: shapes})
  end

  @spec trip(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def trip(conn, %{"trip_id" => trip_id}) do
    shape_for_trip_fn =
      Application.get_env(
        :skate_web,
        :shape_for_trip_fn,
        &Schedule.shape_with_stops_for_trip/1
      )

    Schedule.trips_by_id([trip_id])[trip_id]

    shape =
      trip_id
      |> shape_for_trip_fn.()
      |> format_stops()

    json(conn, %{data: shape})
  end

  defp format_stops(nil), do: nil
  # TODO: this kind of data transformation can happen on the FE
  defp format_stops(shape_with_stops) do
    %{shape_with_stops | stops: Enum.map(shape_with_stops.stops, &format_stop(&1))}
  end

  defp format_stop(stop) do
    # if the stop has a parent station, then consider it a station for display purposes
    is_station = stop.is_station || !is_nil(stop.parent_station_id)

    %{
      id: stop.id,
      lat: stop.latitude,
      lon: stop.longitude,
      name: stop.name,
      isStation: is_station
    }
  end
end
