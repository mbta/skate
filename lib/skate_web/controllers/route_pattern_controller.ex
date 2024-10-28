defmodule SkateWeb.RoutePatternController do
  use SkateWeb, :controller

  @spec route(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def route(conn, %{"route_id" => route_id}) do
    route_patterns_fn =
      Application.get_env(:skate_web, :route_patterns_fn, &Schedule.route_patterns_for_route/1)

    shape_for_trip_fn =
      Application.get_env(
        :skate_web,
        :shape_with_stops_fn,
        &Schedule.shape_with_stops_for_trip/1
      )

    trip_fn = Application.get_env(:skate_web, :trip_fn, &Schedule.trip/1)

    route_patterns =
      route_id
      |> route_patterns_fn.()
      |> Enum.map(fn route_pattern ->
        Map.merge(Map.from_struct(route_pattern), %{
          shape: shape_for_trip_fn.(route_pattern.representative_trip_id),
          headsign: trip_fn.(route_pattern.representative_trip_id).headsign
        })
      end)

    json(conn, %{data: route_patterns})
  end
end
