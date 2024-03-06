defmodule SkateWeb.DetoursController do
  use SkateWeb, :controller

  alias Skate.Detours.MissedStops
  alias Skate.Detours.RouteSegments
  alias Util.Location

  @spec finished_detour(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def finished_detour(conn, %{
        "route_pattern_id" => route_pattern_id,
        "connection_start" => connection_start,
        "connection_end" => connection_end
      }) do
    with route_pattern <- route_pattern(route_pattern_id),
         false <- is_nil(route_pattern),
         shape_with_stops <-
           shape_with_stops(route_pattern.representative_trip_id),
         false <- is_nil(shape_with_stops) do
      connection_start_location = Location.new(connection_start["lat"], connection_start["lon"])
      connection_end_location = Location.new(connection_end["lat"], connection_end["lon"])

      %MissedStops.Result{
        missed_stops: missed_stops,
        connection_stop_start: connection_stop_start,
        connection_stop_end: connection_stop_end
      } =
        missed_stops(%MissedStops{
          connection_start: connection_start_location,
          connection_end: connection_end_location,
          stops: shape_with_stops.stops,
          shape: shape_with_stops.points
        })

      {:ok, route_segments} =
        RouteSegments.route_segments(
          shape_with_stops.points,
          connection_start_location,
          connection_end_location
        )

      json(conn, %{
        data: %{
          missed_stops: missed_stops,
          route_segments: route_segments,
          connection_stop_start: connection_stop_start,
          connection_stop_end: connection_stop_end
        }
      })
    else
      _ -> send_resp(conn, :bad_request, "bad request")
    end
  end

  defp route_pattern(route_pattern_id) do
    Application.get_env(:skate_web, :route_pattern_fn, &Schedule.route_pattern/1).(
      route_pattern_id
    )
  end

  defp shape_with_stops(trip_id) do
    Application.get_env(
      :skate_web,
      :shape_with_stops_fn,
      &Schedule.shape_with_stops_for_trip/1
    ).(trip_id)
  end

  defp missed_stops(args) do
    Application.get_env(:skate_web, :missed_stops_fn, &MissedStops.missed_stops/1).(args)
  end
end
