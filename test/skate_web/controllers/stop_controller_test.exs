defmodule SkateWeb.StopControllerTest do
  use SkateWeb.ConnCase
  import Test.Support.Helpers
  import Skate.Factory

  @stations [
    build(:gtfs_stop, %{
      id: "stop1",
      name: "Stop 1",
      location_type: :station,
      routes: [build(:gtfs_route)]
    }),
    build(:gtfs_stop, %{
      id: "stop2",
      name: "Stop 2",
      location_type: :station
    })
  ]
  describe "GET /api/stops/stations" do
    setup do
      reassign_env(:skate_web, :stations_fn, fn -> @stations end)
    end

    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      conn = get(conn, ~p"/api/stops/stations")

      assert redirected_to(conn) == ~p"/auth/cognito"
    end

    @tag :authenticated
    test "when logged in, returns all stations", %{conn: conn} do
      conn = get(conn, ~p"/api/stops/stations")

      assert %{
               "data" => [
                 %{
                   "routes" => [
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
                   "location_type" => "station",
                   "vehicle_type" => nil,
                   "lon" => -71.01,
                   "name" => "Stop 1"
                 },
                 %{
                   "routes" => [],
                   "id" => "stop2",
                   "lat" => 42.01,
                   "location_type" => "station",
                   "vehicle_type" => nil,
                   "lon" => -71.01,
                   "name" => "Stop 2"
                 }
               ]
             } == json_response(conn, 200)
    end
  end

  describe "GET /api/stops" do
    setup do
      reassign_env(:skate_web, :stops_fn, fn ->
        [
          build(:gtfs_stop, %{
            id: "stop1",
            name: "Stop 1",
            location_type: :station,
            routes: [build(:gtfs_route)]
          }),
          build(:gtfs_stop, %{
            id: "stop2",
            name: "Stop 2",
            location_type: :stop,
            vehicle_type: 3
          })
        ]
      end)

      reassign_env(:skate_web, :version_fn, fn -> "latest_version" end)
    end

    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      conn = get(conn, ~p"/api/stops")

      assert redirected_to(conn) == ~p"/auth/cognito"
    end

    @tag :authenticated
    test "when logged in, returns all stops", %{conn: conn} do
      conn = get(conn, ~p"/api/stops")

      assert %{
               "data" => [
                 %{
                   "id" => "stop1",
                   "lat" => 42.01,
                   "location_type" => "station",
                   "vehicle_type" => nil,
                   "lon" => -71.01,
                   "name" => "Stop 1",
                   "routes" => [
                     %{
                       "description" => "Key Bus",
                       "direction_names" => %{
                         "0" => "Outbound",
                         "1" => "Inbound"
                       },
                       "garages" => [],
                       "id" => "route",
                       "name" => "Point A - Point B",
                       "type" => 3
                     }
                   ]
                 },
                 %{
                   "id" => "stop2",
                   "lat" => 42.01,
                   "vehicle_type" => 3,
                   "location_type" => "stop",
                   "lon" => -71.01,
                   "name" => "Stop 2",
                   "routes" => []
                 }
               ]
             } == json_response(conn, 200)

      assert ["stale-while-revalidate"] == get_resp_header(conn, "cache-control")
      assert ["latest_version"] == get_resp_header(conn, "etag")
    end

    @tag :authenticated
    test "when sent if-none-match header that matches current version, returns :not_modified", %{
      conn: conn
    } do
      conn =
        conn
        |> put_req_header("if-none-match", "latest_version")
        |> get(~p"/api/stops")

      assert "" == response(conn, :not_modified)
    end

    @tag :authenticated
    test "when sent if-none-match header that doesn't match current version, returns data", %{
      conn: conn
    } do
      conn =
        conn
        |> put_req_header("if-none-match", "old_version")
        |> get(~p"/api/stops")

      assert %{
               "data" => [
                 %{
                   "id" => "stop1",
                   "lat" => 42.01,
                   "location_type" => "station",
                   "vehicle_type" => nil,
                   "lon" => -71.01,
                   "name" => "Stop 1",
                   "routes" => [
                     %{
                       "description" => "Key Bus",
                       "direction_names" => %{
                         "0" => "Outbound",
                         "1" => "Inbound"
                       },
                       "garages" => [],
                       "id" => "route",
                       "name" => "Point A - Point B",
                       "type" => 3
                     }
                   ]
                 },
                 %{
                   "id" => "stop2",
                   "lat" => 42.01,
                   "location_type" => "stop",
                   "vehicle_type" => 3,
                   "lon" => -71.01,
                   "name" => "Stop 2",
                   "routes" => []
                 }
               ]
             } == json_response(conn, 200)
    end
  end
end
