defmodule SkateWeb.DetoursControllerTest do
  alias Skate.OpenRouteServiceAPI.DirectionsRequest
  use SkateWeb.ConnCase

  import Test.Support.Helpers
  import Mox
  import Skate.Factory

  alias Skate.Detours.MissedStops

  setup do
    stub(Skate.OpenRouteServiceAPI.MockClient, :get_directions, fn _ ->
      {:ok, build(:ors_directions_json)}
    end)

    :ok
  end

  describe "unfinished_detour/2" do
    @tag :authenticated
    test "returns unfinished route segments", %{conn: conn} do
      points = [
        build(:gtfs_shape_point, lat: 42.41, lon: -70.99),
        build(:gtfs_shape_point, lat: 42.42, lon: -70.99),
        build(:gtfs_shape_point, lat: 42.43, lon: -70.99),
        build(:gtfs_shape_point, lat: 42.44, lon: -70.99),
        build(:gtfs_shape_point, lat: 42.45, lon: -70.99)
      ]

      route_pattern = build(:gtfs_route_pattern)

      shape_with_stops =
        build(
          :shape_with_stops,
          %{points: points}
        )

      reassign_env(:skate_web, :route_pattern_fn, fn _ -> route_pattern end)
      reassign_env(:skate_web, :shape_with_stops_fn, fn _ -> shape_with_stops end)

      conn =
        post(conn, ~p"/api/detours/unfinished_detour",
          route_pattern_id: route_pattern.id,
          connection_start: %{
            "lat" => 42.425,
            "lon" => -70.99
          }
        )

      assert %{
               "data" => %{
                 "unfinished_route_segments" => %{
                   "before_start_point" => [
                     %{"lat" => 42.41, "lon" => -70.99},
                     %{"lat" => 42.42, "lon" => -70.99},
                     %{"lat" => 42.425, "lon" => -70.99}
                   ],
                   "after_start_point" => [
                     %{"lat" => 42.425, "lon" => -70.99},
                     %{"lat" => 42.43, "lon" => -70.99},
                     %{"lat" => 42.44, "lon" => -70.99},
                     %{"lat" => 42.45, "lon" => -70.99}
                   ]
                 }
               }
             } = json_response(conn, 200)
    end
  end

  describe "finished_detour/2" do
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
        %MissedStops.Result{
          missed_stops: [missed_stop],
          connection_stop_start: nil,
          connection_stop_end: nil
        }
      end)

      conn =
        post(conn, ~p"/api/detours/finished_detour",
          route_pattern_id: route_pattern.id,
          connection_start: %{
            "lat" => connection_start.latitude,
            "lon" => connection_start.longitude
          },
          waypoints: [
            %{
              "lat" => 42.431,
              "lon" => -70.99
            },
            %{
              "lat" => 42.439,
              "lon" => -70.99
            }
          ],
          connection_end: %{"lat" => connection_end.latitude, "lon" => connection_end.longitude}
        )

      expected_missed_stop = Jason.decode!(Jason.encode!(missed_stop))

      assert %{"data" => %{"missed_stops" => [^expected_missed_stop]}} = json_response(conn, 200)
    end

    @tag :authenticated
    test "returns connection points", %{conn: conn} do
      route_pattern = build(:gtfs_route_pattern)
      shape_with_stops = build(:shape_with_stops)

      connection_start = shape_with_stops.points |> Enum.at(1) |> Util.Location.as_location!()
      connection_end = shape_with_stops.points |> Enum.at(2) |> Util.Location.as_location!()
      missed_stop = Enum.at(shape_with_stops.stops, 1)

      connection_stop_start = Enum.at(shape_with_stops.stops, 0)
      connection_stop_end = Enum.at(shape_with_stops.stops, 2)

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
        %MissedStops.Result{
          missed_stops: [missed_stop],
          connection_stop_start: connection_stop_start,
          connection_stop_end: connection_stop_end
        }
      end)

      conn =
        post(conn, ~p"/api/detours/finished_detour",
          route_pattern_id: route_pattern.id,
          waypoints: [
            %{
              "lat" => 42.431,
              "lon" => -70.99
            },
            %{
              "lat" => 42.439,
              "lon" => -70.99
            }
          ],
          connection_start: %{
            "lat" => connection_start.latitude,
            "lon" => connection_start.longitude
          },
          connection_end: %{"lat" => connection_end.latitude, "lon" => connection_end.longitude}
        )

      connection_stop_start = Jason.decode!(Jason.encode!(Enum.at(shape_with_stops.stops, 0)))
      connection_stop_end = Jason.decode!(Jason.encode!(Enum.at(shape_with_stops.stops, 2)))

      assert %{
               "data" => %{
                 "connection_stop_start" => ^connection_stop_start,
                 "connection_stop_end" => ^connection_stop_end
               }
             } = json_response(conn, 200)
    end

    @tag :authenticated
    test "returns route segments", %{conn: conn} do
      points = [
        build(:gtfs_shape_point, lat: 42.41, lon: -70.99),
        build(:gtfs_shape_point, lat: 42.42, lon: -70.99),
        build(:gtfs_shape_point, lat: 42.43, lon: -70.99),
        build(:gtfs_shape_point, lat: 42.44, lon: -70.99),
        build(:gtfs_shape_point, lat: 42.45, lon: -70.99)
      ]

      route_pattern = build(:gtfs_route_pattern)

      shape_with_stops =
        build(
          :shape_with_stops,
          %{points: points}
        )

      reassign_env(:skate_web, :route_pattern_fn, fn _ -> route_pattern end)
      reassign_env(:skate_web, :shape_with_stops_fn, fn _ -> shape_with_stops end)

      conn =
        post(conn, ~p"/api/detours/finished_detour",
          route_pattern_id: route_pattern.id,
          connection_start: %{
            "lat" => 42.425,
            "lon" => -70.99
          },
          waypoints: [
            %{
              "lat" => 42.431,
              "lon" => -70.99
            },
            %{
              "lat" => 42.439,
              "lon" => -70.99
            }
          ],
          connection_end: %{
            "lat" => 42.445,
            "lon" => -70.99
          }
        )

      assert %{
               "data" => %{
                 "route_segments" => %{
                   "before_detour" => [
                     %{"lat" => 42.41, "lon" => -70.99},
                     %{"lat" => 42.42, "lon" => -70.99},
                     %{"lat" => 42.425, "lon" => -70.99}
                   ],
                   "detour" => [
                     %{"lat" => 42.425, "lon" => -70.99},
                     %{"lat" => 42.43, "lon" => -70.99},
                     %{"lat" => 42.44, "lon" => -70.99},
                     %{"lat" => 42.445, "lon" => -70.99}
                   ],
                   "after_detour" => [
                     %{"lat" => 42.445, "lon" => -70.99},
                     %{"lat" => 42.45, "lon" => -70.99}
                   ]
                 }
               }
             } = json_response(conn, 200)
    end

    @tag :authenticated
    test "returns detour shape as geojson from ORS", %{conn: conn} do
      expect(Skate.OpenRouteServiceAPI.MockClient, :get_directions, fn _ ->
        {:ok, build(:ors_directions_json, coordinates: [[0, 0], [0.5, 0.5], [1, 1]])}
      end)

      route_pattern = build(:gtfs_route_pattern)
      shape_with_stops = build(:shape_with_stops)

      reassign_env(:skate_web, :route_pattern_fn, fn _ -> route_pattern end)
      reassign_env(:skate_web, :shape_with_stops_fn, fn _ -> shape_with_stops end)

      conn =
        post(conn, ~p"/api/detours/finished_detour",
          route_pattern_id: route_pattern.id,
          connection_start: %{
            "lat" => 42.425,
            "lon" => -70.99
          },
          waypoints: [
            %{
              "lat" => 42.431,
              "lon" => -70.99
            },
            %{
              "lat" => 42.439,
              "lon" => -70.99
            }
          ],
          connection_end: %{
            "lat" => 42.445,
            "lon" => -70.99
          }
        )

      assert %{
               "data" => %{
                 "detour_shape" => %{
                   "coordinates" => [
                     %{"lat" => 0, "lon" => 0},
                     %{"lat" => 0.5, "lon" => 0.5},
                     %{"lat" => 1, "lon" => 1}
                   ]
                 }
               }
             } =
               json_response(conn, 200)
    end

    @tag :authenticated
    test "returns turn-by-turn directions from ORS", %{conn: conn} do
      expect(Skate.OpenRouteServiceAPI.MockClient, :get_directions, fn _ ->
        {:ok,
         build(:ors_directions_json,
           segments: [
             %{
               "steps" => [
                 %{
                   "instruction" => "1",
                   "type" => 1
                 },
                 %{
                   "instruction" => "2",
                   "type" => 0
                 }
               ]
             },
             %{
               "steps" => [
                 %{
                   "instruction" => "3",
                   "type" => 2
                 }
               ]
             }
           ]
         )}
      end)

      route_pattern = build(:gtfs_route_pattern)
      shape_with_stops = build(:shape_with_stops)

      reassign_env(:skate_web, :route_pattern_fn, fn _ -> route_pattern end)
      reassign_env(:skate_web, :shape_with_stops_fn, fn _ -> shape_with_stops end)

      conn =
        post(conn, ~p"/api/detours/finished_detour",
          route_pattern_id: route_pattern.id,
          connection_start: %{
            "lat" => 42.425,
            "lon" => -70.99
          },
          waypoints: [
            %{
              "lat" => 42.431,
              "lon" => -70.99
            },
            %{
              "lat" => 42.439,
              "lon" => -70.99
            }
          ],
          connection_end: %{
            "lat" => 42.445,
            "lon" => -70.99
          }
        )

      assert %{
               "data" => %{
                 "detour_shape" => %{
                   "directions" => [
                     %{"instruction" => "1"},
                     %{"instruction" => "2"},
                     %{"instruction" => "3"}
                   ]
                 }
               }
             } =
               json_response(conn, 200)
    end

    @tag :authenticated
    test "formats coordinates as [lon, lat] when sending to ORS and includes the start and end points",
         %{conn: conn} do
      expect(Skate.OpenRouteServiceAPI.MockClient, :get_directions, fn request ->
        assert %DirectionsRequest{
                 coordinates: [
                   [-70.99, 42.425],
                   [-70.99, 42.431],
                   [-70.99, 42.439],
                   [-70.99, 42.445]
                 ]
               } = request

        {:ok, build(:ors_directions_json, coordinates: [[0, 0], [0.5, 0.5], [1, 1]])}
      end)

      route_pattern = build(:gtfs_route_pattern)
      shape_with_stops = build(:shape_with_stops)

      reassign_env(:skate_web, :route_pattern_fn, fn _ -> route_pattern end)
      reassign_env(:skate_web, :shape_with_stops_fn, fn _ -> shape_with_stops end)

      post(conn, ~p"/api/detours/finished_detour",
        route_pattern_id: route_pattern.id,
        connection_start: %{
          "lat" => 42.425,
          "lon" => -70.99
        },
        waypoints: [
          %{
            "lat" => 42.431,
            "lon" => -70.99
          },
          %{
            "lat" => 42.439,
            "lon" => -70.99
          }
        ],
        connection_end: %{
          "lat" => 42.445,
          "lon" => -70.99
        }
      )
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
        post(conn, ~p"/api/detours/finished_detour",
          route_pattern_id: "nonexistent_route_pattern",
          connection_start: %{
            "lat" => connection_start.latitude,
            "lon" => connection_start.longitude
          },
          waypoints: [
            %{
              "lat" => 42.431,
              "lon" => -70.99
            },
            %{
              "lat" => 42.439,
              "lon" => -70.99
            }
          ],
          connection_end: %{"lat" => connection_end.latitude, "lon" => connection_end.longitude}
        )

      assert response(conn, :bad_request)
    end
  end
end
