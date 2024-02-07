defmodule SkateWeb.ShuttleControllerTest do
  use SkateWeb.ConnCase
  import Test.Support.Helpers

  alias Schedule.Gtfs.{Route, RoutePattern, Shape}

  describe "GET /api/shuttles" do
    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> get("/api/shuttles")

      assert redirected_to(conn) == ~p"/auth/cognito"
    end

    @tag :authenticated
    test "when logged in, returns only shuttle routes", %{conn: conn} do
      reassign_env(:skate_web, :routes_fn, fn ->
        [
          %Route{id: "non-shuttle", name: "Non Shuttle", direction_names: %{}, description: ""},
          %Route{
            id: "shuttle",
            name: "Shuttle",
            direction_names: %{},
            description: "Rail Replacement Bus"
          }
        ]
      end)

      reassign_env(:skate_web, :route_pattern_fn, fn _route_id, _direction_id -> nil end)
      reassign_env(:skate_web, :shapes_fn, fn _route_id -> [%Shape{id: "id", points: []}] end)

      conn =
        conn
        |> api_headers()
        |> get("/api/shuttles")

      assert %{"data" => [%{"id" => "shuttle"}]} = json_response(conn, 200)
    end

    @tag :authenticated
    test "only allows shuttle routes that have shapes", %{conn: conn} do
      reassign_env(:skate_web, :routes_fn, fn ->
        [
          %Route{
            id: "has_shape",
            name: "has_shape",
            direction_names: %{},
            description: "Rail Replacement Bus"
          },
          %Route{
            id: "no_shape",
            name: "no_shape",
            direction_names: %{},
            description: "Rail Replacement Bus"
          }
        ]
      end)

      reassign_env(:skate_web, :route_pattern_fn, fn _route_id, _direction_id -> nil end)

      reassign_env(:skate_web, :shapes_fn, fn route_id ->
        case route_id do
          "has_shape" -> [%Shape{id: "id", points: []}]
          "no_shape" -> []
        end
      end)

      conn =
        conn
        |> api_headers()
        |> get("/api/shuttles")

      assert %{"data" => [%{"id" => "has_shape"}]} = json_response(conn, 200)
    end

    @tag :authenticated
    test "replaces the name with the first 0-direction route pattern name", %{conn: conn} do
      reassign_env(:skate_web, :routes_fn, fn ->
        [
          %Route{
            id: "shuttle",
            name: "Shuttle",
            direction_names: %{},
            description: "Rail Replacement Bus"
          }
        ]
      end)

      reassign_env(:skate_web, :route_pattern_fn, fn _route_id, _direction_id ->
        %RoutePattern{
          id: "shuttle-pattern",
          name: "Pattern Name",
          route_id: "shuttle",
          direction_id: 0,
          representative_trip_id: ""
        }
      end)

      reassign_env(:skate_web, :shapes_fn, fn _route_id -> [%Shape{id: "id", points: []}] end)

      conn =
        conn
        |> api_headers()
        |> get("/api/shuttles")

      assert %{"data" => [%{"name" => "Pattern Name"}]} = json_response(conn, 200)
    end
  end

  defp api_headers(conn) do
    conn
    |> put_req_header("accept", "application/json")
    |> put_req_header("content-type", "application/json")
  end
end
