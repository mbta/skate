defmodule SkateWeb.SwingsControllerTest do
  use SkateWeb.ConnCase
  use Skate.DataCase
  import Test.Support.Helpers

  alias Schedule.Swing
  alias Skate.Settings.RouteSettings

  @swings [
    %Swing{
      from_run_id: "123-456",
      from_route_id: "1",
      from_trip_id: "1234",
      to_run_id: "123-789",
      to_route_id: "2",
      to_trip_id: "5678",
      time: 100
    }
  ]

  describe "GET /api/swings" do
    setup %{user: username} do
      if username, do: RouteSettings.get_or_create(username)
      reassign_env(:skate_web, :swings_fn, fn _route_id, _start_time, _end_time -> @swings end)
    end

    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> get("/api/swings")

      assert redirected_to(conn) == "/auth/cognito"
    end

    @tag :authenticated
    test "when logged in, returns all swings for selected routes", %{conn: conn} do
      conn =
        conn
        |> api_headers()
        |> put("/api/route_settings", %{
          "selectedRouteIds" => ["1", "2"]
        })
        |> get("/api/swings")

      assert %{
               "data" => [
                 %{
                   "from_route_id" => "1",
                   "from_run_id" => "123-456",
                   "from_trip_id" => "1234",
                   "time" => 100,
                   "to_route_id" => "2",
                   "to_run_id" => "123-789",
                   "to_trip_id" => "5678"
                 }
               ]
             } = json_response(conn, 200)
    end
  end

  defp api_headers(conn) do
    conn
    |> put_req_header("accept", "application/json")
    |> put_req_header("content-type", "application/json")
  end
end
