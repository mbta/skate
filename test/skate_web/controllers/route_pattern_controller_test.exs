defmodule SkateWeb.RoutePatternControllerTest do
  use SkateWeb.ConnCase
  import Skate.Factory
  import Test.Support.Helpers

  alias Schedule.Gtfs.{Stop, Route, RoutePattern}
  alias Schedule.Gtfs.Shape.Point
  alias Schedule.ShapeWithStops

  describe "GET /api/route_patterns/route/:route_id" do
    @shape_with_stops %ShapeWithStops{
      id: "shape1",
      points: [
        %Point{
          shape_id: "shape1",
          lat: 42.413560,
          lon: -70.992110,
          sequence: "0"
        }
      ],
      stops: [
        %Stop{
          id: "stop_1",
          name: "One",
          latitude: 42.01,
          longitude: -71.01,
          routes: [
            %Route{
              id: "route_1",
              name: "route_1_name",
              description: "Key Route",
              direction_names: %{}
            }
          ]
        },
        %Stop{id: "stop_2", name: "Two", latitude: 42.02, longitude: -71.02, routes: []}
      ]
    }

    @shape_with_stops_json %{
      "id" => "shape1",
      "points" => [
        %{
          "shape_id" => "shape1",
          "lat" => 42.413560,
          "lon" => -70.992110,
          "sequence" => "0"
        }
      ],
      "stops" => [
        %{
          "id" => "stop_1",
          "name" => "One",
          "lat" => 42.01,
          "lon" => -71.01,
          "location_type" => "stop",
          "routes" => [
            %{
              "id" => "route_1",
              "name" => "route_1_name",
              "description" => "Key Route",
              "direction_names" => %{},
              "garages" => [],
              "type" => 3
            }
          ]
        },
        %{
          "id" => "stop_2",
          "name" => "Two",
          "lat" => 42.02,
          "lon" => -71.02,
          "location_type" => "stop",
          "routes" => []
        }
      ]
    }

    @route_patterns [
      %RoutePattern{
        id: "1",
        name: "Route Pattern 1",
        route_id: "r1",
        direction_id: 0,
        representative_trip_id: "t1",
        sort_order: 0,
        time_desc: "Mornings only"
      },
      %RoutePattern{
        id: "2",
        name: "Route Pattern 2",
        route_id: "r1",
        direction_id: 1,
        representative_trip_id: "t2",
        sort_order: 1
      }
    ]

    @trip_t1 build(:trip, %{id: "t1", headsign: "headsign"})
    @trip_t2 build(:trip, %{id: "t2", headsign: nil})

    setup do
      reassign_env(:skate_web, :route_patterns_fn, fn _route_id -> @route_patterns end)

      reassign_env(:skate_web, :shape_with_stops_fn, fn trip_id ->
        case trip_id do
          "t1" -> @shape_with_stops
          _ -> nil
        end
      end)

      reassign_env(:skate_web, :trip_fn, fn trip_id ->
        case trip_id do
          "t1" -> @trip_t1
          "t2" -> @trip_t2
        end
      end)
    end

    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> get("/api/route_patterns/route/r1")

      assert redirected_to(conn) == ~p"/auth/cognito"
    end

    @tag :authenticated
    test "when logged in, returns the shapes for this route", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> get("/api/route_patterns/route/r1")

      %{headsign: headsign_t1} = @trip_t1
      %{headsign: headsign_t2} = @trip_t2

      assert %{
               "data" => [
                 %{
                   "id" => "1",
                   "name" => "Route Pattern 1",
                   "route_id" => "r1",
                   "direction_id" => 0,
                   "sort_order" => 0,
                   "time_desc" => "Mornings only",
                   "shape" => @shape_with_stops_json,
                   "headsign" => ^headsign_t1
                 },
                 %{
                   "id" => "2",
                   "name" => "Route Pattern 2",
                   "route_id" => "r1",
                   "direction_id" => 1,
                   "sort_order" => 1,
                   "time_desc" => nil,
                   "shape" => nil,
                   "headsign" => ^headsign_t2
                 }
               ]
             } = json_response(conn, 200)
    end
  end

  defp api_headers(conn) do
    conn
    |> put_req_header("accept", "application/json")
    |> put_req_header("content-type", "application/json")
  end
end
