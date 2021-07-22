defmodule Schedule.DataTest do
  use ExUnit.Case, async: true

  alias Schedule.Block
  alias Schedule.Data
  alias Schedule.Trip
  alias Schedule.Swing
  alias Schedule.Gtfs.{Route, RoutePattern, Shape, Stop, StopTime, Timepoint}
  alias Schedule.Gtfs.Shape.Point
  alias Schedule.Minischedule

  test "all_routes/1 returns all the routes" do
    routes = [
      %Route{
        id: "39",
        description: "Key Bus",
        direction_names: %{
          0 => "Outbound",
          1 => "Inbound"
        },
        name: "39"
      },
      %Route{
        id: "66",
        description: "Key Bus",
        direction_names: %{
          0 => "Outbound",
          1 => "Inbound"
        },
        name: "66"
      }
    ]

    data = %Data{
      routes: routes
    }

    assert Data.all_routes(data) == routes
  end

  describe "timepoints_on_route/2" do
    test "returns the timepoints for the given route ID" do
      data = %Data{
        timepoints_by_route: %{
          "1" => [
            %Timepoint{id: "t1", name: "t1 name"},
            %Timepoint{id: "t2", name: "t2 name"},
            %Timepoint{id: "t3", name: "t3 name"},
            %Timepoint{id: "t4", name: "t4 name"}
          ]
        }
      }

      assert Data.timepoints_on_route(data, "1") == [
               %Timepoint{id: "t1", name: "t1 name"},
               %Timepoint{id: "t2", name: "t2 name"},
               %Timepoint{id: "t3", name: "t3 name"},
               %Timepoint{id: "t4", name: "t4 name"}
             ]
    end

    test "returns an empty list if the route ID isn't found" do
      data = %Data{
        timepoints_by_route: %{
          "1" => [
            %Timepoint{id: "t1", name: "t1 name"},
            %Timepoint{id: "t2", name: "t2 name"},
            %Timepoint{id: "t3", name: "t3 name"},
            %Timepoint{id: "t4", name: "t4 name"}
          ]
        }
      }

      assert Data.timepoints_on_route(data, "2") == []
    end
  end

  describe "stop/2" do
    test "returns the stop for the given stop ID" do
      data = %Data{
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
        }
      }

      assert Data.stop(data, "2") == %Stop{
               id: "2",
               name: "Two",
               parent_station_id: "3"
             }
    end

    test "returns nil if the given stop ID is not found" do
      data = %Data{
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
        }
      }

      assert Data.stop(data, "4") == nil
    end
  end

  describe "trip" do
    test "trip/1 returns the trip" do
      data = %Data{
        trips: %{
          "t1" => %Trip{
            id: "t1",
            block_id: "b"
          }
        }
      }

      assert %Trip{id: "t1"} = Data.trip(data, "t1")
    end

    test "trip/1 returns nil if the trip doesn't exist" do
      data = %Data{}

      assert Data.trip(data, "t1") == nil
    end
  end

  describe "trips_by_id/2" do
    test "returns trips specified by ID" do
      data = %Data{
        trips: %{
          "t1" => %Trip{
            id: "t1",
            block_id: "b"
          },
          "t2" => %Trip{
            id: "t2",
            block_id: "b"
          },
          "t3" => %Trip{
            id: "t3",
            block_id: "b"
          }
        }
      }

      trips = Data.trips_by_id(data, ["t1", "t2"])
      assert Enum.count(trips) == 2

      trip_ids = Enum.map(trips, fn {_trip_id, trip} -> trip.id end)
      assert "t1" in trip_ids
      assert "t2" in trip_ids
    end
  end

  describe "block" do
    test "block returns the block" do
      block = %Block{
        id: "block",
        service_id: "service",
        start_time: 0,
        end_time: 0,
        trips: []
      }

      data = %Data{
        blocks: %{{"block", "service"} => block}
      }

      assert Data.block(data, "block", "service") == block
    end

    test "block doesn't return blocks with the same block_id but a different date" do
      block = %Block{
        id: "block",
        service_id: "service",
        start_time: 0,
        end_time: 0,
        trips: []
      }

      data = %Data{
        blocks: %{{"block", "service"} => block}
      }

      assert Data.block(data, "b", "other_service") == nil
    end

    test "block returns nil if the block doesn't exist" do
      data = %Data{}

      assert Data.block(data, "block", "service") == nil
    end
  end

  describe "potentially_active_service_dates" do
    test "returns a day" do
      # 2019-12-17 12:00:00 EST
      time = 1_576_598_400
      assert Data.potentially_active_service_dates(time, time) == [~D[2019-12-17]]
    end

    test "returns yesterday and today for early morning times" do
      # 2019-12-17 01:00:00 EST
      time = 1_576_558_800
      assert Data.potentially_active_service_dates(time, time) == [~D[2019-12-16], ~D[2019-12-17]]
    end

    test "returns multiple dates for a time range" do
      # 2019-12-17 01:00:00 EST
      start_time = 1_576_558_800
      # 2019-12-19 22:00:00 EST
      end_time = 1_576_807_200

      assert Data.potentially_active_service_dates(start_time, end_time) == [
               ~D[2019-12-16],
               ~D[2019-12-17],
               ~D[2019-12-18],
               ~D[2019-12-19]
             ]
    end
  end

  describe "active_trips" do
    test "returns an active trip" do
      trip = %Trip{
        id: "active",
        block_id: "active",
        service_id: "today",
        stop_times: [
          %StopTime{
            stop_id: "stop",
            time: 3
          },
          %StopTime{
            stop_id: "stop",
            time: 4
          }
        ],
        start_time: 3,
        end_time: 4
      }

      data = %Data{
        trips: %{trip.id => trip},
        calendar: %{
          ~D[2019-01-01] => ["today"]
        }
      }

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800
      assert Data.active_trips(data, time0 + 2, time0 + 5) == [trip]
    end

    test "doesn't return a trip active at a different time today" do
      trip = %Trip{
        id: "trip",
        block_id: "block",
        service_id: "today",
        stop_times: [
          %StopTime{
            stop_id: "stop",
            time: 3
          }
        ]
      }

      data = %Data{
        trips: %{
          "trip" => trip
        },
        calendar: %{
          ~D[2019-01-01] => ["today"]
        }
      }

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800
      assert Data.active_trips(data, time0 + 1, time0 + 2) == []
    end

    test "doesn't return a trip active at this time on a different day" do
      trip = %Trip{
        id: "trip",
        block_id: "block",
        service_id: "tomorrow",
        stop_times: [
          %StopTime{
            stop_id: "stop",
            time: 2
          }
        ]
      }

      data = %Data{
        trips: %{
          "trip" => trip
        },
        calendar: %{
          ~D[2019-01-02] => ["tomorrow"]
        }
      }

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800
      assert Data.active_trips(data, time0 + 1, time0 + 3) == []
    end

    test "returns late-night trips that are still active from yesterday" do
      trip = %Trip{
        id: "trip",
        block_id: "block",
        service_id: "yesterday",
        stop_times: [
          %StopTime{
            stop_id: "stop",
            # 24:00:02
            time: 86402
          }
        ],
        start_time: 86402,
        end_time: 86402
      }

      data = %Data{
        trips: %{
          "trip" => trip
        },
        calendar: %{
          ~D[2018-12-31] => ["yesterday"]
        }
      }

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800
      assert Data.active_trips(data, time0 + 1, time0 + 3) == [trip]
    end
  end

  describe "active_blocks" do
    test "returns active blocks" do
      block = %Block{
        id: "block",
        service_id: "today",
        start_time: 3,
        end_time: 4,
        trips: []
      }

      data = %Data{
        blocks: %{
          "block" => block
        },
        calendar: %{
          ~D[2019-01-01] => ["today"]
        }
      }

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800

      assert Data.active_blocks(data, time0 + 2, time0 + 5) == %{~D[2019-01-01] => [block]}
    end

    test "doesn't return inactive blocks" do
      block = %Block{
        id: "block",
        service_id: "today",
        start_time: 3,
        end_time: 4,
        trips: []
      }

      data = %Data{
        blocks: %{
          "block" => block
        },
        calendar: %{
          ~D[2019-01-01] => ["today"]
        }
      }

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800

      assert Data.active_blocks(data, time0 + 5, time0 + 5) == %{}
    end

    test "blocks can be active on two different dates" do
      just_before_midnight = 24 * 60 * 60 - 1

      block1 = %Block{
        id: "block",
        service_id: "today",
        start_time: just_before_midnight,
        end_time: just_before_midnight,
        trips: []
      }

      block2 = %Block{
        id: "block",
        service_id: "tomorrow",
        start_time: 1,
        end_time: 1,
        trips: []
      }

      data = %Data{
        blocks: %{
          "block1" => block1,
          "block2" => block2
        },
        calendar: %{
          ~D[2019-01-01] => ["today"],
          ~D[2019-01-02] => ["tomorrow"]
        }
      }

      # 2019-01-02 00:00:00 EST
      time0 = 1_546_405_200

      assert Data.active_blocks(data, time0 - 2, time0 + 2) == %{
               ~D[2019-01-01] => [block1],
               ~D[2019-01-02] => [block2]
             }
    end
  end

  describe "shapes" do
    test "returns the shapes for the given route" do
      shapes = [
        %Shape{
          id: "shape1",
          points: [
            %Point{
              shape_id: "shape1",
              lat: 42.413560,
              lon: -70.992110,
              sequence: 0
            }
          ]
        },
        %Shape{
          id: "shape2",
          points: [
            %Point{
              shape_id: "shape2",
              lat: 43.413560,
              lon: -71.992110,
              sequence: 0
            }
          ]
        }
      ]

      data = %Data{
        shapes: %{
          "route1" => shapes
        }
      }

      assert Data.shapes(data, "route1") == shapes
    end

    test "returns [] if there are no shapes for the given route" do
      data = %Data{
        shapes: %{
          "route1" => [
            %Shape{
              id: "shape1",
              points: [
                %Point{
                  shape_id: "shape1",
                  lat: 42.413560,
                  lon: -70.992110,
                  sequence: 0
                }
              ]
            }
          ]
        }
      }

      assert Data.shapes(data, "shapelessRoute") == []
    end
  end

  describe "shape_for_trip" do
    test "returns the shape for the given trip_id" do
      trip = %Trip{
        id: "trip",
        block_id: "block",
        route_id: "route",
        shape_id: "shape"
      }

      shape = %Shape{
        id: "shape",
        points: [
          %Point{
            shape_id: "shape",
            lat: 42.413560,
            lon: -70.992110,
            sequence: 0
          }
        ]
      }

      data = %Data{
        shapes: %{"route" => [shape]},
        trips: %{"trip" => trip}
      }

      assert Data.shape_for_trip(data, "trip") == shape
    end

    test "returns nil if there is no shape" do
      trip = %Trip{
        id: "trip",
        block_id: "block",
        route_id: "route",
        shape_id: "shape"
      }

      data = %Data{
        trips: %{"trip" => trip}
      }

      assert Data.shape_for_trip(data, "trip") == nil
    end

    test "returns nil if there is no trip" do
      data = %Data{}

      assert Data.shape_for_trip(data, "trip") == nil
    end
  end

  describe "first_route_pattern_for_route_and_direction/3" do
    setup do
      route_patterns = [
        %RoutePattern{
          id: "1",
          name: "Route Pattern 1",
          route_id: "r1",
          direction_id: 0,
          representative_trip_id: "t1"
        },
        %RoutePattern{
          id: "2",
          name: "Route Pattern 2",
          route_id: "r1",
          direction_id: 1,
          representative_trip_id: "t2"
        },
        %RoutePattern{
          id: "3",
          name: "Route Pattern 3",
          route_id: "r1",
          direction_id: 0,
          representative_trip_id: "t3"
        },
        %RoutePattern{
          id: "4",
          name: "Route Pattern 4",
          route_id: "r2",
          direction_id: 0,
          representative_trip_id: "t4"
        }
      ]

      data = %Data{
        route_patterns: route_patterns
      }

      {:ok, data: data}
    end

    test "returns the first route pattern matching the route and direction", %{data: data} do
      assert Data.first_route_pattern_for_route_and_direction(data, "r1", 0) == %RoutePattern{
               id: "1",
               name: "Route Pattern 1",
               route_id: "r1",
               direction_id: 0,
               representative_trip_id: "t1"
             }
    end

    test "returns nil if no route patterns match", %{data: data} do
      assert Data.first_route_pattern_for_route_and_direction(data, "r2", 1) == nil
    end
  end

  describe "minischedule_run" do
    test "returns run for the trip" do
      trip = %Trip{
        id: "trip",
        block_id: "block",
        schedule_id: "schedule",
        run_id: "run"
      }

      run = %Minischedule.Run{
        schedule_id: "schedule",
        id: "run",
        activities: []
      }

      data = %Data{
        trips: %{trip.id => trip},
        minischedule_runs: %{Minischedule.Run.key(run) => run}
      }

      assert Data.minischedule_run(data, trip.id) == run
    end

    test "returns nil if the trip isn't known" do
      data = %Data{}

      assert Data.minischedule_run(data, "trip") == nil
    end

    test "returns nil if the trip is in gtfs but not hastus" do
      trip = %Trip{
        id: "trip",
        block_id: "block",
        schedule_id: nil
      }

      data = %Data{
        trips: %{trip.id => trip}
      }

      assert Data.minischedule_run(data, trip.id) == nil
    end
  end

  describe "minischedule_block" do
    test "returns block for trip" do
      trip = %Trip{
        id: "trip",
        block_id: "block",
        schedule_id: "schedule"
      }

      block = %Minischedule.Block{
        schedule_id: "schedule",
        id: "block",
        pieces: []
      }

      data = %Data{
        trips: %{trip.id => trip},
        minischedule_blocks: %{Minischedule.Block.key(block) => block}
      }

      assert Data.minischedule_block(data, trip.id) == block
    end

    test "returns nil if the trip isn't known" do
      data = %Data{}

      assert Data.minischedule_block(data, "trip") == nil
    end

    test "returns nil if the trip is in gtfs but not hastus" do
      trip = %Trip{
        id: "trip",
        block_id: "block",
        schedule_id: nil
      }

      data = %Data{
        trips: %{trip.id => trip}
      }

      assert Data.minischedule_block(data, trip.id) == nil
    end
  end

  describe "swings_for_route/4" do
    test "returns swings for currently-active service dates" do
      swing = %Swing{
        from_route_id: "1",
        from_run_id: "123-456",
        from_trip_id: "1234",
        to_route_id: "1",
        to_run_id: "123-789",
        to_trip_id: "5678",
        time: 1_000
      }

      data = %Data{
        swings: %{{"today", "1"} => [swing]},
        calendar: %{
          ~D[2019-01-01] => ["today"]
        }
      }

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800
      assert Data.swings_for_route(data, "1", time0 + 2, time0 + 5) == [swing]
    end
  end

  describe "parse_files/1" do
    test "includes certain hardcoded garage IDs as checkpoints" do
      hardcoded_garage_ids =
        Data.parse_files(%{gtfs: %{}, hastus: %{}})
        |> Map.get(:timepoint_names_by_id)
        |> Map.keys()
        |> Enum.sort()

      assert hardcoded_garage_ids == ~w[cabot charl fell lynn ncamb prwb somvl]
    end
  end
end
