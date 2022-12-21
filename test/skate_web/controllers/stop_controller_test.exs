defmodule SkateWeb.StopControllerTest do
  use SkateWeb.ConnCase
  import Test.Support.Helpers
  import Skate.Factory

  @stations [
    build(:gtfs_stop, %{location_type: 1, connections: [build(:gtfs_route)]}),
    build(:gtfs_stop, %{
      id: "stop2",
      name: "Stop 2",
      location_type: 1
    })
  ]
  describe "GET /api/stops/stations" do
    setup do
      reassign_env(:skate_web, :stations_fn, fn -> @stations end)
    end

    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      conn = get(conn, SkateWeb.Router.Helpers.stop_path(conn, :stations))

      assert redirected_to(conn) == "/auth/cognito"
    end

    @tag :authenticated
    test "when logged in, returns all stations", %{conn: conn} do
      conn = get(conn, SkateWeb.Router.Helpers.stop_path(conn, :stations))

      assert %{
               "data" => [
                 %{
                   "connections" => [
                     %{
                       "description" => "Key Bus",
                       "direction_names" => %{"0" => "Outbound", "1" => "Inbound"},
                       "garages" => [],
                       "id" => "route",
                       "type" => 3,
                       "name" => "Point A - Point B"
                     }
                   ],
                   "id" => "stop1",
                   "lat" => 42.01,
                   "location_type" => 1,
                   "lon" => -71.01,
                   "name" => "Stop 1"
                 },
                 %{
                   "connections" => [],
                   "id" => "stop2",
                   "lat" => 42.01,
                   "location_type" => 1,
                   "lon" => -71.01,
                   "name" => "Stop 2"
                 }
               ]
             } == json_response(conn, 200)
    end
  end
end
