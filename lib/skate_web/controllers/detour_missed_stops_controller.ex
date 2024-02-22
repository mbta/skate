defmodule SkateWeb.DetourMissedStopsController do
  use SkateWeb, :controller

  alias Skate.Detours.MissedStops
  alias Util.Location

  @spec missed_stops(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def missed_stops(conn, %{
        "route_pattern_id" => route_pattern_id,
        "connection_start" => connection_start,
        "connection_end" => connection_end
      }) do
    route_pattern_fn =
      Application.get_env(:skate_web, :route_pattern_fn, &Schedule.route_pattern/1)

    shape_with_stops_fn =
      Application.get_env(
        :skate_web,
        :shape_with_stops_fn,
        &Schedule.shape_with_stops_for_trip/1
      )

    missed_stops_fn =
      Application.get_env(:skate_web, :missed_stops_fn, &MissedStops.missed_stops/1)

    with route_pattern <- route_pattern_fn.(route_pattern_id),
         false <- is_nil(route_pattern),
         shape_with_stops <-
           shape_with_stops_fn.(route_pattern.representative_trip_id),
         false <- is_nil(shape_with_stops) do
      connection_start_location = Location.new(connection_start["lat"], connection_start["lon"])
      connection_end_location = Location.new(connection_end["lat"], connection_end["lon"])

      missed_stops =
        missed_stops_fn.(%MissedStops{
          connection_start: connection_start_location,
          connection_end: connection_end_location,
          stops: shape_with_stops.stops,
          shape: shape_with_stops.points
        })

      json(conn, %{data: missed_stops})
    else
      _ -> send_resp(conn, :bad_request, "bad request")
    end
  end
end
