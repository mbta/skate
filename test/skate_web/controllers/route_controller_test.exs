defmodule SkateWeb.RouteControllerTest do
  use SkateWeb.ConnCase
  import Test.Support.Helpers

  alias Gtfs.Route
  alias SkateWeb.AuthManager

  @routes [
    %Route{id: "1", name: "1", direction_names: %{}, description: ""},
    %Route{
      id: "shuttle",
      name: "Shuttle",
      direction_names: %{},
      description: "Rail Replacement Bus"
    }
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

      assert redirected_to(conn) == "/auth/cognito"
    end

    test "when logged in, returns all non-shuttle routes", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> logged_in()
        |> get("/api/routes")

      assert %{"data" => [%{"id" => "1"}]} = json_response(conn, 200)
    end
  end

  describe "GET /api/routes/:route_id" do
    setup do
      reassign_env(:skate_web, :timepoint_ids_on_route_fn, fn _route_id -> [] end)
    end

    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> get("/api/routes/1")

      assert redirected_to(conn) == "/auth/cognito"
    end

    test "when logged in, returns the timepoints for this route", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> logged_in()
        |> get("/api/routes/1")

      assert json_response(conn, 200) == %{"data" => []}
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
