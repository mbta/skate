defmodule SkateWeb.ShapeControllerTest do
  use SkateWeb.ConnCase
  import Test.Support.Helpers

  alias Schedule.Gtfs.{Shape, Stop, Route}
  alias Schedule.Gtfs.Shape.Point
  alias Schedule.ShapeWithStops

  @shape %Shape{
    id: "shape1",
    points: [
      %Point{
        shape_id: "shape1",
        lat: 42.413560,
        lon: -70.992110,
        sequence: "0"
      }
    ]
  }

  @shape_json %{
    "id" => "shape1",
    "points" => [
      %{
        "shape_id" => "shape1",
        "lat" => 42.413560,
        "lon" => -70.992110,
        "sequence" => "0"
      }
    ]
  }

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
        vehicle_type: 3,
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
      %Stop{
        id: "stop_2",
        name: "Two",
        vehicle_type: 3,
        latitude: 42.02,
        longitude: -71.02,
        routes: []
      }
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
        "vehicle_type" => 3,
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
        "vehicle_type" => 3,
        "routes" => []
      }
    ]
  }

  describe "GET /api/shapes/route/:route_id" do
    setup do
      reassign_env(:skate_web, :shapes_fn, fn _route_id -> [@shape] end)
    end

    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> get("/api/shapes/route/1")

      assert redirected_to(conn) == ~p"/auth/keycloak"
    end

    @tag :authenticated
    test "when logged in, returns the shapes for this route", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> get("/api/shapes/route/1")

      assert json_response(conn, 200) == %{"data" => [@shape_json]}
    end
  end

  describe "GET /api/shapes/trip/:trip_id" do
    setup do
      reassign_env(:skate_web, :shape_with_stops_fn, fn _trip_id -> @shape_with_stops end)
    end

    @tag :authenticated
    test "when logged in, returns the shape for this trip", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> get("/api/shapes/trip/1")

      assert json_response(conn, 200) == %{"data" => @shape_with_stops_json}
    end

    @tag :authenticated
    test "returns null if we don't have a shape for this trip", %{conn: conn} do
      reassign_env(:skate_web, :shape_with_stops_fn, fn _trip_id -> nil end)

      conn =
        conn
        |> api_headers()
        |> get("/api/shapes/trip/1")

      assert json_response(conn, 200) == %{"data" => nil}
    end
  end

  defp api_headers(conn) do
    conn
    |> put_req_header("accept", "application/json")
    |> put_req_header("content-type", "application/json")
  end
end
