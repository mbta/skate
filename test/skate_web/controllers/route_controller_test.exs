defmodule SkateWeb.RouteControllerTest do
  use SkateWeb.ConnCase
  import Test.Support.Helpers

  alias SkateWeb.AuthManager

  describe "GET /api/routes" do
    setup do
      reassign_env(:skate_web, :routes_fn, fn -> [] end)
    end

    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> get("/api/routes")

      assert redirected_to(conn) == "/auth/cognito"
    end

    test "when logged in, returns all the routes", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> logged_in()
        |> get("/api/routes")

      assert json_response(conn, 200) == %{"data" => []}
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
