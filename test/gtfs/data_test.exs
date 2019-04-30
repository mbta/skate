defmodule Gtfs.DataTest do
  use ExUnit.Case, async: true

  alias Gtfs.Data
  alias Gtfs.Route
  alias Gtfs.RoutePattern
  alias Gtfs.Timepoint
  alias Gtfs.Trip

  test "all_routes/1returns all the routes" do
    data = %Data{
      routes: [%Route{id: "1"}, %Route{id: "2"}],
      route_patterns: [],
      stops: [],
      trip_stops: %{},
      trip_timepoints: %{},
      trips: []
    }

    assert Data.all_routes(data) == [%Route{id: "1"}, %Route{id: "2"}]
  end

  test "timepoints_on_route/2 returns all timepoints for this route (either direction), sorted" do
    data = %Data{
      routes: [%Route{id: "r1"}, %Route{id: "r2"}],
      route_patterns: [
        %RoutePattern{
          id: "rp1",
          route_id: "r1",
          direction_id: 0,
          representative_trip_id: "t1"
        },
        %RoutePattern{
          id: "rp2",
          route_id: "r2",
          direction_id: 0,
          representative_trip_id: "t2"
        },
        %RoutePattern{
          id: "rp3",
          route_id: "r1",
          direction_id: 1,
          representative_trip_id: "t3"
        }
      ],
      stops: [],
      trip_stops: %{},
      trip_timepoints: %{
        "t1" => [%Timepoint{id: "tp1", stop_id: "s1"}],
        "t2" => [%Timepoint{id: "tp2", stop_id: "s2"}, %Timepoint{id: "tp3", stop_id: "s3"}],
        "t3" => [%Timepoint{id: "tp4", stop_id: "s4"}]
      },
      trips: [
        %Trip{
          id: "t1",
          route_id: "r1"
        },
        %Trip{
          id: "t2",
          route_id: "r2"
        }
      ]
    }

    assert Data.timepoints_on_route(data, "r1") == [
             %Timepoint{id: "tp1", stop_id: "s1"},
             %Timepoint{id: "tp4", stop_id: "s4"}
           ]
  end

  test "stops_on_route/2 returns all stops for this route (either direction), sorted" do
    data = %Data{
      routes: [%Route{id: "r1"}, %Route{id: "r2"}],
      route_patterns: [
        %RoutePattern{
          id: "rp1",
          route_id: "r1",
          direction_id: 0,
          representative_trip_id: "t1"
        },
        %RoutePattern{
          id: "rp2",
          route_id: "r2",
          direction_id: 0,
          representative_trip_id: "t2"
        },
        %RoutePattern{
          id: "rp3",
          route_id: "r1",
          direction_id: 1,
          representative_trip_id: "t3"
        }
      ],
      stops: [],
      trip_stops: %{
        "t1" => ["s1"],
        "t2" => ["s2", "s3"],
        "t3" => ["s4"]
      },
      trip_timepoints: %{},
      trips: [
        %Trip{
          id: "t1",
          route_id: "r1"
        },
        %Trip{
          id: "t2",
          route_id: "r2"
        }
      ]
    }

    assert Data.stops_on_route(data, "r1") == ["s1", "s4"]
  end

  test "fetch_url/1 requests data from the given URL" do
    bypass = Bypass.open()
    url = "http://localhost:#{bypass.port}/MBTA_GTFS.zip"

    Bypass.expect(bypass, fn conn ->
      Plug.Conn.resp(conn, 200, "test-data")
    end)

    assert {:ok, %HTTPoison.Response{body: "test-data", status_code: 200}} = Data.fetch_url(url)
  end
end
