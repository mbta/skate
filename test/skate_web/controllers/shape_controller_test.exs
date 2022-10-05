defmodule SkateWeb.ShapeControllerTest do
  use SkateWeb.ConnCase
  import Test.Support.Helpers

  alias Schedule.Gtfs.Shape.Point

  @shape %{
    id: "shape1",
    points: [
      %Point{
        shape_id: "shape1",
        lat: "42.413560",
        lon: "-70.992110",
        sequence: "0"
      }
    ],
    stops: []
  }

  @shape_json %{
    "id" => "shape1",
    "points" => [
      %{
        "shape_id" => "shape1",
        "lat" => "42.413560",
        "lon" => "-70.992110",
        "sequence" => "0"
      }
    ],
    "stops" => []
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

      assert redirected_to(conn) == "/auth/cognito"
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
      reassign_env(:skate_web, :shape_for_trip_fn, fn _trip_id -> @shape end)
    end

    @tag :authenticated
    test "when logged in, returns the shape for this trip", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> get("/api/shapes/trip/1")

      assert json_response(conn, 200) == %{"data" => @shape_json}
    end

    @tag :authenticated
    test "returns null if we don't have a shape for this trip", %{conn: conn} do
      reassign_env(:skate_web, :shape_for_trip_fn, fn _trip_id -> nil end)

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
