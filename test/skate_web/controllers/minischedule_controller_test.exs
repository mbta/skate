defmodule SkateWeb.MinischeduleControllerTest do
  use SkateWeb.ConnCase
  import Test.Support.Helpers

  alias Schedule.Minischedule

  @run %Minischedule.Run{
    schedule_id: "schedule",
    id: "run",
    activities: []
  }

  @block %Minischedule.Block{
    schedule_id: "schedule",
    id: "block",
    pieces: []
  }

  describe "GET /api/minischedule/run/:trip_id" do
    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      reassign_env(:skate_web, :run_fn, fn _trip_id -> @run end)

      conn =
        conn
        |> api_headers()
        |> get("/api/minischedule/run/1")

      assert redirected_to(conn) == "/auth/cognito"
    end

    @tag :authenticated
    test "when logged in, returns the run for this trip", %{conn: conn} do
      reassign_env(:skate_web, :run_fn, fn _trip_id -> @run end)

      conn =
        conn
        |> api_headers()
        |> get("/api/minischedule/run/1")

      assert json_response(conn, 200) == %{
               "data" => %{
                 "schedule_id" => "schedule",
                 "id" => "run",
                 "activities" => []
               }
             }
    end

    @tag :authenticated
    test "returns null if there's no minischedule for this trip", %{conn: conn} do
      reassign_env(:skate_web, :run_fn, fn _trip_id -> nil end)

      conn =
        conn
        |> api_headers()
        |> get("/api/minischedule/run/1")

      assert json_response(conn, 200) == %{"data" => nil}
    end
  end

  describe "GET /api/minischedule/block/:trip_id" do
    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      reassign_env(:skate_web, :block_fn, fn _trip_id -> @block end)

      conn =
        conn
        |> api_headers()
        |> get("/api/minischedule/block/1")

      assert redirected_to(conn) == "/auth/cognito"
    end

    @tag :authenticated
    test "when logged in, returns the block for this trip", %{conn: conn} do
      reassign_env(:skate_web, :block_fn, fn _trip_id -> @block end)

      conn =
        conn
        |> api_headers()
        |> get("/api/minischedule/block/1")

      assert json_response(conn, 200) == %{
               "data" => %{
                 "schedule_id" => "schedule",
                 "id" => "block",
                 "pieces" => []
               }
             }
    end

    @tag :authenticated
    test "returns null if there's no minischedule for this trip", %{conn: conn} do
      reassign_env(:skate_web, :block_fn, fn _trip_id -> nil end)

      conn =
        conn
        |> api_headers()
        |> get("/api/minischedule/block/1")

      assert json_response(conn, 200) == %{"data" => nil}
    end
  end

  defp api_headers(conn) do
    conn
    |> put_req_header("accept", "application/json")
    |> put_req_header("content-type", "application/json")
  end
end
