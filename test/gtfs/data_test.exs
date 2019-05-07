defmodule Gtfs.DataTest do
  use ExUnit.Case, async: true

  alias Gtfs.Data
  alias Gtfs.Route
  alias Gtfs.RoutePattern
  alias Gtfs.StopTime
  alias Gtfs.Trip

  test "all_routes/1 returns all the routes" do
    data = %Data{
      routes: [%Route{id: "1"}, %Route{id: "2"}],
      route_patterns: [],
      stops: [],
      trip_stop_times: %{},
      trips: []
    }

    assert Data.all_routes(data) == [%Route{id: "1"}, %Route{id: "2"}]
  end

  test "all_trips/1 returns all the trips" do
    data = %Data{
      routes: [],
      route_patterns: [],
      stops: [],
      trip_stop_times: %{},
      trips: [%Trip{id: "t1", route_id: "r1"}, %Trip{id: "t2", route_id: "r2"}]
    }

    assert Data.all_trips(data) == [
             %Trip{id: "t1", route_id: "r1"},
             %Trip{id: "t2", route_id: "r2"}
           ]
  end

  test "stop_times_on_trip/2 returns all stop times for this route (either direction), sorted" do
    data = %Data{
      routes: [%Route{id: "r1"}, %Route{id: "r2"}],
      route_patterns: [],
      stops: [],
      trip_stop_times: %{
        "t1" => [
          %StopTime{stop_id: "s1", timepoint_id: nil},
          %StopTime{stop_id: "s2", timepoint_id: nil}
        ],
        "t2" => [
          %StopTime{stop_id: "s3", timepoint_id: nil}
        ]
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

    assert Data.stop_times_on_trip(data, "t1") == [
             %StopTime{stop_id: "s1", timepoint_id: nil},
             %StopTime{stop_id: "s2", timepoint_id: nil}
           ]
  end

  test "timepoint_ids_on_route/2 returns all timepoint IDs for this route (either direction), sorted" do
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
      trip_stop_times: %{
        "t1" => [
          %StopTime{stop_id: "s1", timepoint_id: "tp1"},
          %StopTime{stop_id: "s7", timepoint_id: nil}
        ],
        "t2" => [
          %StopTime{stop_id: "s2", timepoint_id: "tp2"},
          %StopTime{stop_id: "s3", timepoint_id: "tp3"}
        ],
        "t3" => [
          %StopTime{stop_id: "s4", timepoint_id: "tp4"},
          %StopTime{stop_id: "s5", timepoint_id: "tp1"}
        ]
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

    assert Data.timepoint_ids_on_route(data, "r1") == ["tp4", "tp1"]
  end
end
