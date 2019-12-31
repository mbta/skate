defmodule SkateWeb.ShapeControllerTest do
  use SkateWeb.ConnCase
  import Test.Support.Helpers

  alias Gtfs.Shape
  alias Gtfs.Shape.Point
  alias SkateWeb.AuthManager

  describe "GET /api/shapes/:route_id" do
    setup do
      shape = %Shape{
        id: "shape1",
        points: [
          %Point{
            shape_id: "shape1",
            lat: "42.413560",
            lon: "-70.992110",
            sequence: "0"
          }
        ]
      }

      reassign_env(:skate_web, :shapes_fn, fn _route_id -> shape end)
    end

    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> get("/api/shapes/1")

      assert redirected_to(conn) == "/auth/cognito"
    end

    test "when logged in, returns the timepoints for this route", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> logged_in()
        |> get("/api/shapes/1")

      assert json_response(conn, 200) == %{
               "data" => %{
                 "id" => "shape1",
                 "points" => [
                   %{
                     "shape_id" => "shape1",
                     "lat" => "42.413560",
                     "lon" => "-70.992110",
                     "sequence" => "0"
                   }
                 ]
               }
             }
    end
  end

  defp api_headers(conn) do
    conn
    |> put_req_header("accept", "application/json")
    |> put_req_header("content-type", "application/json")
  end

  defp logged_in(conn) do
    {:ok, token, _} = AuthManager.encode_and_sign(%{})

    put_req_header(conn, "authorization", "bearer: " <> token)
  end
end
