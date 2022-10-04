defmodule SkateWeb.ShapeController do
  use SkateWeb, :controller

  @spec route(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def route(conn, %{"route_id" => route_id}) do
    shapes_fn =
      Application.get_env(
        :skate_web,
        :shapes_with_stops_for_route,
        &Schedule.shapes_with_stops_for_route/1
      )

    shapes = shapes_fn.(route_id)

    json(conn, %{data: shapes})
  end

  @spec trip(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def trip(conn, %{"trip_id" => trip_id}) do
    shape_for_trip_fn =
      Application.get_env(
        :skate_web,
        :shape_with_stops_for_trip,
        &Schedule.shape_with_stops_for_trip/1
      )

    Schedule.trips_by_id([trip_id])[trip_id]

    shape = shape_for_trip_fn.(trip_id)

    json(conn, %{data: shape})
  end
end
