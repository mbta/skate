defmodule SkateWeb.DetoursControllerTest do
  use SkateWeb.ConnCase

  import Test.Support.Helpers
  import Skate.Factory

  alias Skate.Detours.MissedStops

  describe "missed_stops/2" do
    @tag :authenticated
    test "returns missed stops", %{conn: conn} do
      route_pattern = build(:gtfs_route_pattern)
      shape_with_stops = build(:shape_with_stops)
      missed_stop = Enum.at(shape_with_stops.stops, 0)

      connection_start = shape_with_stops.points |> Enum.at(0) |> Util.Location.as_location!()
      connection_end = shape_with_stops.points |> Enum.at(1) |> Util.Location.as_location!()

      reassign_env(:skate_web, :route_pattern_fn, fn _ -> route_pattern end)
      reassign_env(:skate_web, :shape_with_stops_fn, fn _ -> shape_with_stops end)

      reassign_env(:skate_web, :missed_stops_fn, fn %MissedStops{
                                                      connection_start: ^connection_start,
                                                      connection_end: ^connection_end,
                                                      stops: stops,
                                                      shape: shape
                                                    }
                                                    when stops == shape_with_stops.stops and
                                                           shape == shape_with_stops.points ->
        [missed_stop]
      end)

      conn =
        post(conn, ~p"/api/detours/finished_detour_info",
          route_pattern_id: route_pattern.id,
          connection_start: %{
            "lat" => connection_start.latitude,
            "lon" => connection_start.longitude
          },
          connection_end: %{"lat" => connection_end.latitude, "lon" => connection_end.longitude}
        )

      expected_missed_stop = Jason.decode!(Jason.encode!(missed_stop))

      assert %{"data" => %{"missed_stops" => [^expected_missed_stop]}} = json_response(conn, 200)
    end

    @tag :authenticated
    test "returns bad request if bad data is sent", %{conn: conn} do
      route_pattern = nil
      shape_with_stops = build(:shape_with_stops)

      connection_start = shape_with_stops.points |> Enum.at(0) |> Util.Location.as_location!()
      connection_end = shape_with_stops.points |> Enum.at(1) |> Util.Location.as_location!()

      reassign_env(:skate_web, :route_pattern_fn, fn _ -> route_pattern end)
      reassign_env(:skate_web, :shape_with_stops_fn, fn _ -> shape_with_stops end)

      conn =
        post(conn, ~p"/api/detours/finished_detour_info",
          route_pattern_id: "nonexistent_route_pattern",
          connection_start: %{
            "lat" => connection_start.latitude,
            "lon" => connection_start.longitude
          },
          connection_end: %{"lat" => connection_end.latitude, "lon" => connection_end.longitude}
        )

      assert response(conn, :bad_request)
    end
  end
end
