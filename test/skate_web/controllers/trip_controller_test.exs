defmodule SkateWeb.TripControllerTest do
  use SkateWeb.ConnCase

  alias SkateWeb.AuthManager

  describe "GET /api/trips/:route_id" do
    setup do
      real_trips_fn = Application.get_env(:skate_web, :active_trips_on_route_fn)

      on_exit(fn ->
        Application.put_env(
          :skate_web,
          :active_trips_on_route_fn,
          real_trips_fn
        )
      end)

      Application.put_env(
        :skate_web,
        :active_trips_on_route_fn,
        fn _route_id, _start_time, _end_time -> [] end
      )
    end

    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> get("/api/trips/1", "start_time=1&end_time=2")

      assert redirected_to(conn) == "/auth/cognito"
    end

    test "when logged in, returns the timepoints for this route", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> logged_in()
        |> get("/api/trips/1", start_time: "1", end_time: "2")

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
