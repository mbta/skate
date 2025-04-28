defmodule SkateWeb.ScheduleControllerTest do
  use SkateWeb.ConnCase

  import Skate.Factory
  import Test.Support.Helpers

  @run build(
         :run,
         schedule_id: "schedule",
         id: "run",
         activities: []
       )

  @block build(
           :block,
           pieces: []
         )

  @timepoints build_list(
                2,
                :gtfs_timepoint
              )

  describe "GET /api/schedule/run" do
    test "when logged out, redirects you to keycloak auth", %{conn: conn} do
      reassign_env(:skate, :schedule_run_fn, fn _run_id, _trip_id -> @run end)
      reassign_env(:skate, :schedule_run_timepoints_fn, fn _run -> @timepoints end)

      conn =
        conn
        |> api_headers()
        |> get("/api/schedule/run?trip_id=trip&run_id=run")

      assert redirected_to(conn) == ~p"/auth/keycloak"
    end

    @tag :authenticated
    test "when logged in, returns the run for the trip", %{conn: conn} do
      reassign_env(:skate, :schedule_run_fn, fn _run_id, _trip_id -> @run end)
      reassign_env(:skate, :schedule_run_timepoints_fn, fn _run -> @timepoints end)

      conn =
        conn
        |> api_headers()
        |> get("/api/schedule/run?trip_id=trip&run_id=run")

      assert json_response(conn, 200) == %{
               "data" => %{
                 "run" => %{
                   "schedule_id" => "schedule",
                   "id" => "run",
                   "activities" => [],
                   "service_id" => "service"
                 },
                 "timepoints" => [
                   %{
                     "id" => "Schedule.Gtfs.Timepoint.id:0",
                     "name" => "Timepoint Schedule.Gtfs.Timepoint.id:0"
                   },
                   %{
                     "id" => "Schedule.Gtfs.Timepoint.id:1",
                     "name" => "Timepoint Schedule.Gtfs.Timepoint.id:1"
                   }
                 ]
               }
             }
    end

    @tag :authenticated
    test "when logged in, returns the run for the trip without an explicit run ID", %{conn: conn} do
      reassign_env(:skate, :schedule_run_fn, fn _run_id, _trip_id -> @run end)
      reassign_env(:skate, :schedule_run_timepoints_fn, fn _run -> @timepoints end)

      conn =
        conn
        |> api_headers()
        |> get("/api/schedule/run?trip_id=trip")

      assert json_response(conn, 200) == %{
               "data" => %{
                 "run" => %{
                   "schedule_id" => "schedule",
                   "id" => "run",
                   "activities" => [],
                   "service_id" => "service"
                 },
                 "timepoints" => [
                   %{
                     "id" => "Schedule.Gtfs.Timepoint.id:0",
                     "name" => "Timepoint Schedule.Gtfs.Timepoint.id:0"
                   },
                   %{
                     "id" => "Schedule.Gtfs.Timepoint.id:1",
                     "name" => "Timepoint Schedule.Gtfs.Timepoint.id:1"
                   }
                 ]
               }
             }
    end

    @tag :authenticated
    test "returns null if there's no schedule data for this trip", %{conn: conn} do
      reassign_env(:skate, :schedule_run_fn, fn _run_id, _trip_id -> nil end)

      conn =
        conn
        |> api_headers()
        |> get("/api/schedule/run?trip_id=trip&run_id=run")

      assert json_response(conn, 200) == %{"data" => %{"run" => nil, "timepoints" => nil}}
    end
  end

  describe "GET /api/schedule/block" do
    test "when logged out, redirects you to keycloak auth", %{conn: conn} do
      reassign_env(:skate, :schedule_block_fn, fn _trip_id -> @block end)
      reassign_env(:skate, :schedule_block_timepoints_fn, fn _block -> @timepoints end)

      conn =
        conn
        |> api_headers()
        |> get("/api/schedule/block?trip_id=trip")

      assert redirected_to(conn) == ~p"/auth/keycloak"
    end

    @tag :authenticated
    test "when logged in, returns the block for this trip", %{conn: conn} do
      reassign_env(:skate, :schedule_block_fn, fn _trip_id -> @block end)
      reassign_env(:skate, :schedule_block_timepoints_fn, fn _block -> @timepoints end)

      conn =
        conn
        |> api_headers()
        |> get("/api/schedule/block?trip_id=trip")

      assert json_response(conn, 200) == %{
               "data" => %{
                 "block" => %{
                   "schedule_id" => "schedule",
                   "id" => "block",
                   "pieces" => []
                 },
                 "timepoints" => [
                   %{
                     "id" => "Schedule.Gtfs.Timepoint.id:0",
                     "name" => "Timepoint Schedule.Gtfs.Timepoint.id:0"
                   },
                   %{
                     "id" => "Schedule.Gtfs.Timepoint.id:1",
                     "name" => "Timepoint Schedule.Gtfs.Timepoint.id:1"
                   }
                 ]
               }
             }
    end

    @tag :authenticated
    test "returns null if there's no schedule data for this trip", %{conn: conn} do
      reassign_env(:skate, :schedule_block_fn, fn _trip_id -> nil end)

      conn =
        conn
        |> api_headers()
        |> get("/api/schedule/block?trip_id=trip")

      assert json_response(conn, 200) == %{"data" => %{"block" => nil, "timepoints" => nil}}
    end
  end

  defp api_headers(conn) do
    conn
    |> put_req_header("accept", "application/json")
    |> put_req_header("content-type", "application/json")
  end
end
