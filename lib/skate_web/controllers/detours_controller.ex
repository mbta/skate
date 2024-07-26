defmodule SkateWeb.DetoursController do
  alias Realtime.Shape
  alias Realtime.TripModification
  alias Skate.OpenRouteServiceAPI
  use SkateWeb, :controller

  alias Skate.Detours.MissedStops
  alias Skate.Detours.RouteSegments
  alias Util.Location

  @spec unfinished_detour(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def unfinished_detour(conn, %{
        "route_pattern_id" => route_pattern_id,
        "connection_start" => connection_start
      }) do
    with route_pattern <- route_pattern(route_pattern_id),
         false <- is_nil(route_pattern),
         shape_with_stops <-
           shape_with_stops(route_pattern.representative_trip_id),
         false <- is_nil(shape_with_stops) do
      connection_start_location = Location.new(connection_start["lat"], connection_start["lon"])

      {:ok, route_segments} =
        RouteSegments.unfinished_route_segments(
          shape_with_stops.points,
          connection_start_location
        )

      json(conn, %{
        data: %{
          unfinished_route_segments: format(route_segments)
        }
      })
    end
  end

  @spec finished_detour(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def finished_detour(
        conn,
        %{
          "route_pattern_id" => route_pattern_id,
          "connection_start" => connection_start,
          "waypoints" => waypoints,
          "connection_end" => connection_end
        }
      ) do
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

      {:ok, ors_result} =
        OpenRouteServiceAPI.directions([connection_start] ++ waypoints ++ [connection_end])

      with shape_id <- Ecto.UUID.generate(),
           shape <-
             Shape.new(%Shape.Input{
               shape_id: shape_id,
               route_segments: route_segments,
               detour_shape: ors_result
             }),
           # TODO: Revisit the idea of `TripModification`s without missed stops
           false <- missed_stops == [],
           {:ok, modification} <-
             TripModification.new(%TripModification.Input{
               route_pattern: route_pattern,
               shape_with_stops: shape_with_stops,
               missed_stops: missed_stops,
               service_date: Date.utc_today(),
               last_modified_time: DateTime.utc_now(),
               shape_id: shape_id
             }) do
        trip_modification_publisher().publish_modification(modification, shape, is_draft?: true)
      end

      json(conn, %{
        data: %{
          missed_stops: missed_stops,
          route_segments: format(route_segments),
          connection_stop_start: connection_stop_start,
          connection_stop_end: connection_stop_end,
          detour_shape: ors_result
        }
      })
    else
      _ -> send_resp(conn, :bad_request, "bad request")
    end
  end

  defp format(%RouteSegments.UnfinishedResult{
         before_start_point: before_start_point,
         after_start_point: after_start_point
       }) do
    %{
      before_start_point: format_locations(before_start_point),
      after_start_point: format_locations(after_start_point)
    }
  end

  defp format(%RouteSegments.Result{
         before_detour: before_detour,
         detour: detour,
         after_detour: after_detour
       }) do
    %{
      before_detour: format_locations(before_detour),
      detour: format_locations(detour),
      after_detour: format_locations(after_detour)
    }
  end

  defp format_locations(locations) do
    locations
    |> Enum.map(&Location.as_location!/1)
    |> Enum.map(fn %Util.Location{latitude: latitude, longitude: longitude} ->
      %{lat: latitude, lon: longitude}
    end)
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

  defp trip_modification_publisher() do
    Application.get_env(
      :skate_web,
      :trip_modification_publisher,
      Skate.Detours.TripModificationPublisher
    )
  end
end
