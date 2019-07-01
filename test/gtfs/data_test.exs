defmodule Gtfs.DataTest do
  use ExUnit.Case, async: true

  alias Gtfs.{Block, Data, Route, RoutePattern, Stop, StopTime, Trip}

  test "all_routes/1 returns all the routes" do
    routes = [
      %Route{
        id: "39",
        direction_names: %{
          0 => "Outbound",
          1 => "Inbound"
        }
      },
      %Route{
        id: "66",
        direction_names: %{
          0 => "Outbound",
          1 => "Inbound"
        }
      }
    ]

    data = %Data{
      routes: routes,
      route_patterns: [],
      stops: %{},
      trips: %{},
      blocks: %{}
    }

    assert Data.all_routes(data) == routes
  end

  describe "timepoint_ids_on_route/2" do
    test "returns all timepoint IDs for this route (either direction), sorted" do
      data = %Data{
        routes: [%Route{id: "r1", direction_names: %{}}, %Route{id: "r2", direction_names: %{}}],
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
        trips: %{
          "t1" => %Trip{
            id: "t1",
            route_id: "r1",
            service_id: "service",
            headsign: "h1",
            direction_id: 0,
            block_id: "b1",
            route_pattern_id: "rp1",
            stop_times: [
              %StopTime{stop_id: "s1", time: 1, timepoint_id: "tp1"},
              %StopTime{stop_id: "s7", time: 2, timepoint_id: nil}
            ]
          },
          "t2" => %Trip{
            id: "t2",
            route_id: "r2",
            service_id: "service",
            headsign: "h2",
            direction_id: 0,
            block_id: "b2",
            route_pattern_id: "rp2",
            stop_times: [
              %StopTime{stop_id: "s2", time: 1, timepoint_id: "tp2"},
              %StopTime{stop_id: "s3", time: 2, timepoint_id: "tp3"}
            ]
          },
          "t3" => %Trip{
            id: "t3",
            route_id: "r1",
            service_id: "service",
            headsign: "h3",
            direction_id: 1,
            block_id: "b3",
            route_pattern_id: "rp3",
            stop_times: [
              %StopTime{stop_id: "s4", time: 1, timepoint_id: "tp4"},
              %StopTime{stop_id: "s5", time: 2, timepoint_id: "tp1"}
            ]
          }
        },
        blocks: %{}
      }

      assert Data.timepoint_ids_on_route(data, "r1") == ["tp4", "tp1"]
    end

    test "groups timepoints together even when they're on different stops" do
      data = %Data{
        routes: [%Route{id: "r1", direction_names: %{}}],
        route_patterns: [
          %RoutePattern{
            id: "rp1",
            route_id: "r1",
            direction_id: 1,
            representative_trip_id: "t1"
          },
          %RoutePattern{
            id: "rp2",
            route_id: "r1",
            direction_id: 1,
            representative_trip_id: "t2"
          }
        ],
        stops: [],
        trips: %{
          "t1" => %Trip{
            id: "t1",
            route_id: "r1",
            service_id: "service",
            headsign: "h1",
            direction_id: 1,
            block_id: "b1",
            route_pattern_id: "rp1",
            stop_times: [
              %StopTime{stop_id: "s1", time: 1, timepoint_id: "t1"},
              %StopTime{stop_id: "s3b", time: 2, timepoint_id: "t3"}
            ]
          },
          "t2" => %Trip{
            id: "t2",
            route_id: "r1",
            service_id: "service",
            headsign: "h2",
            direction_id: 1,
            block_id: "b2",
            route_pattern_id: "rp2",
            stop_times: [
              %StopTime{stop_id: "s1", time: 1, timepoint_id: "t1"},
              %StopTime{stop_id: "s2", time: 2, timepoint_id: "t2"},
              %StopTime{stop_id: "s3a", time: 3, timepoint_id: "t3"},
              %StopTime{stop_id: "s4", time: 4, timepoint_id: "t4"}
            ]
          }
        },
        blocks: %{}
      }

      assert Data.timepoint_ids_on_route(data, "r1") == ["t1", "t2", "t3", "t4"]
    end
  end

  describe "stop/2" do
    test "returns the stop for the given stop ID" do
      data = %Data{
        routes: [],
        route_patterns: [],
        stops: %{
          "1" => %Stop{
            id: "1",
            name: "One",
            parent_station_id: nil
          },
          "2" => %Stop{
            id: "2",
            name: "Two",
            parent_station_id: "3"
          }
        },
        trips: %{},
        blocks: %{}
      }

      assert Data.stop(data, "2") == %Stop{
               id: "2",
               name: "Two",
               parent_station_id: "3"
             }
    end

    test "returns nil if the given stop ID is not found" do
      data = %Data{
        routes: [],
        route_patterns: [],
        stops: %{
          "1" => %Stop{
            id: "1",
            name: "One",
            parent_station_id: nil
          },
          "2" => %Stop{
            id: "2",
            name: "Two",
            parent_station_id: "3"
          }
        },
        trips: %{},
        blocks: %{}
      }

      assert Data.stop(data, "4") == nil
    end
  end

  describe "trip" do
    test "trip/1 returns the trip" do
      data = %Data{
        routes: [],
        route_patterns: [],
        stops: %{},
        trips: %{
          "t1" => %Trip{
            id: "t1",
            route_id: "r1",
            service_id: "service",
            headsign: "h",
            direction_id: 1,
            block_id: "b",
            route_pattern_id: "r1-_-0",
            stop_times: [
              %StopTime{stop_id: "s1", time: 1, timepoint_id: nil}
            ]
          }
        },
        blocks: %{}
      }

      assert %Trip{id: "t1"} = Data.trip(data, "t1")
    end

    test "trip/1 returns nil if the trip doesn't exist" do
      data = %Data{
        routes: [],
        route_patterns: [],
        stops: %{},
        trips: %{},
        blocks: %{}
      }

      assert Data.trip(data, "t1") == nil
    end
  end

  describe "block" do
    test "block returns the trips on the block" do
      trip = %Trip{
        id: "t1",
        route_id: "r1",
        service_id: "service",
        headsign: "h",
        direction_id: 1,
        block_id: "b",
        route_pattern_id: "r1-_-0",
        stop_times: [
          %StopTime{stop_id: "s1", time: 1, timepoint_id: nil}
        ]
      }

      data = %Data{
        routes: [],
        route_patterns: [],
        stops: %{},
        trips: %{},
        blocks: Block.group_trips_by_block([trip])
      }

      assert [%Trip{id: "t1"}] = Data.block(data, "b", "service")
    end

    test "block doesn't return trips on the same block but a different date" do
      trip = %Trip{
        id: "t1",
        route_id: "r1",
        service_id: "service",
        headsign: "h",
        direction_id: 1,
        block_id: "b",
        route_pattern_id: "r1-_-0",
        stop_times: [
          %StopTime{stop_id: "s1", time: 1, timepoint_id: nil}
        ]
      }

      data = %Data{
        routes: [],
        route_patterns: [],
        stops: %{},
        trips: %{},
        blocks: Block.group_trips_by_block([trip])
      }

      assert Data.block(data, "b", "other_service") == nil
    end

    test "block returns nil if the block doesn't exist" do
      data = %Data{
        routes: [],
        route_patterns: [],
        stops: %{},
        trips: %{},
        blocks: %{}
      }

      assert Data.trip(data, "block") == nil
    end
  end
end
