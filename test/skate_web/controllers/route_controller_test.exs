defmodule SkateWeb.RouteControllerTest do
  use SkateWeb.ConnCase
  import Test.Support.Helpers
  import Skate.Factory

  @routes [
    build(:gtfs_route, %{
      id: "1",
      name: "1",
      direction_names: %{},
      description: "",
      garages: MapSet.new(["Garage A", "Garage B"])
    }),
    build(:gtfs_route, %{
      id: "shuttle",
      name: "Shuttle",
      direction_names: %{},
      description: "Rail Replacement Bus"
    })
  ]

  describe "GET /api/routes" do
    setup do
      reassign_env(:skate_web, :routes_fn, fn -> @routes end)
    end

    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> get("/api/routes")

      assert redirected_to(conn) == ~p"/auth/keycloak"
    end

    @tag :authenticated
    test "when logged in, returns all non-shuttle routes", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> get("/api/routes")

      assert %{"data" => [%{"id" => "1", "garages" => garages}]} = json_response(conn, 200)

      assert Enum.count(garages) == 2
      assert "Garage A" in garages
      assert "Garage B" in garages
    end
  end

  describe "GET /api/routes/:route_id" do
    setup do
      reassign_env(:skate_web, :timepoints_on_route_fn, fn _route_id -> [] end)
    end

    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> get("/api/routes/1")

      assert redirected_to(conn) == ~p"/auth/keycloak"
    end

    @tag :authenticated
    test "when logged in, returns the timepoints for this route", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> get("/api/routes/1")

      assert json_response(conn, 200) == %{"data" => []}
    end
  end

  defp api_headers(conn) do
    conn
    |> put_req_header("accept", "application/json")
    |> put_req_header("content-type", "application/json")
  end
end
