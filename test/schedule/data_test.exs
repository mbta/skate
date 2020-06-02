defmodule Schedule.DataTest do
  use ExUnit.Case, async: true

  alias Schedule.Block
  alias Schedule.Data
  alias Schedule.Trip
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

  describe "block" do
    test "block returns the trips on the block" do
      trip = %Trip{
        id: "t1",
        block_id: "b",
        service_id: "service",
        stop_times: [
          %StopTime{stop_id: "s1", time: 1, timepoint_id: nil}
        ]
      }

      data = %Data{
        blocks: Block.group_trips_by_block([trip])
      }

      assert [%Trip{id: "t1"}] = Data.block(data, "b", "service")
    end

    test "block doesn't return trips on the same block but a different date" do
      trip = %Trip{
        id: "t1",
        block_id: "b",
        service_id: "service",
        stop_times: [
          %StopTime{stop_id: "s1", time: 1, timepoint_id: nil}
        ]
      }

      data = %Data{
        blocks: Block.group_trips_by_block([trip])
      }

      assert Data.block(data, "b", "other_service") == nil
    end

    test "block returns nil if the block doesn't exist" do
      data = %Data{}

      assert Data.trip(data, "block") == nil
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
      block = [
        %Trip{
          id: "trip",
          block_id: "block",
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
      ]

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
      data = %Data{
        blocks: %{
          "block" => [
            %Trip{
              id: "trip",
              block_id: "block",
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
              ]
            }
          ]
        },
        calendar: %{
          ~D[2019-01-01] => ["today"]
        }
      }

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800

      assert Data.active_blocks(data, time0 + 5, time0 + 5) == %{}
    end

    test "returns a block only once if it has multiple active trips" do
      block = [
        %Trip{
          id: "first",
          block_id: "block",
          service_id: "today",
          stop_times: [
            %StopTime{
              stop_id: "stop",
              time: 2
            }
          ],
          start_time: 2,
          end_time: 2
        },
        %Trip{
          id: "second",
          block_id: "block",
          service_id: "today",
          stop_times: [
            %StopTime{
              stop_id: "stop",
              time: 3
            }
          ],
          start_time: 3,
          end_time: 3
        }
      ]

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
      assert Data.active_blocks(data, time0 + 1, time0 + 4) == %{~D[2019-01-01] => [block]}
    end

    test "blocks can be active on two different dates" do
      just_before_midnight = 24 * 60 * 60 - 1

      block1 = [
        %Trip{
          id: "first",
          block_id: "block",
          service_id: "today",
          stop_times: [
            %StopTime{
              stop_id: "stop",
              time: just_before_midnight
            }
          ],
          start_time: just_before_midnight,
          end_time: just_before_midnight
        }
      ]

      block2 = [
        %Trip{
          id: "second",
          block_id: "block",
          service_id: "tomorrow",
          stop_times: [
            %StopTime{
              stop_id: "stop",
              time: 1
            }
          ],
          start_time: 1,
          end_time: 1
        }
      ]

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

  describe "timepoints_for_route/4" do
    test "returns all timepoint IDs for this route (either direction), sorted" do
      route_patterns = [
        %RoutePattern{
          id: "rp1",
          name: "rp1",
          route_id: "r1",
          direction_id: 0,
          representative_trip_id: "t1"
        },
        %RoutePattern{
          id: "rp2",
          name: "rp2",
          route_id: "r2",
          direction_id: 0,
          representative_trip_id: "t2"
        },
        %RoutePattern{
          id: "rp3",
          name: "rp3",
          route_id: "r1",
          direction_id: 1,
          representative_trip_id: "t3"
        }
      ]

      stop_times_by_id = %{
        "t1" => [
          %StopTime{stop_id: "s1", time: 1, timepoint_id: "tp1"},
          %StopTime{stop_id: "s7", time: 2, timepoint_id: nil}
        ],
        "t2" => [
          %StopTime{stop_id: "s2", time: 1, timepoint_id: "tp2"},
          %StopTime{stop_id: "s3", time: 2, timepoint_id: "tp3"}
        ],
        "t3" => [
          %StopTime{stop_id: "s4", time: 1, timepoint_id: "tp4"},
          %StopTime{stop_id: "s5", time: 2, timepoint_id: "tp1"}
        ]
      }

      timepoints_by_id = %{
        "tp1" => %Timepoint{id: "tp1", name: "tp1 name"},
        "tp2" => %Timepoint{id: "tp2", name: "tp2 name"},
        "tp3" => %Timepoint{id: "tp3", name: "tp3 name"},
        "tp4" => %Timepoint{id: "tp4", name: "tp4 name"}
      }

      assert Data.timepoints_for_route(route_patterns, "r1", stop_times_by_id, timepoints_by_id) ==
               [
                 %Timepoint{id: "tp4", name: "tp4 name"},
                 %Timepoint{id: "tp1", name: "tp1 name"}
               ]
    end

    test "groups timepoints together even when they're on different stops" do
      route_patterns = [
        %RoutePattern{
          id: "rp1",
          name: "rp1",
          route_id: "r1",
          direction_id: 1,
          representative_trip_id: "t1"
        },
        %RoutePattern{
          id: "rp2",
          name: "rp2",
          route_id: "r1",
          direction_id: 1,
          representative_trip_id: "t2"
        }
      ]

      stop_times_by_id = %{
        "t1" => [
          %StopTime{stop_id: "s1", time: 1, timepoint_id: "tp1"},
          %StopTime{stop_id: "s3b", time: 2, timepoint_id: "tp3"}
        ],
        "t2" => [
          %StopTime{stop_id: "s1", time: 1, timepoint_id: "tp1"},
          %StopTime{stop_id: "s2", time: 2, timepoint_id: "tp2"},
          %StopTime{stop_id: "s3a", time: 3, timepoint_id: "tp3"},
          %StopTime{stop_id: "s4", time: 4, timepoint_id: "tp4"}
        ]
      }

      timepoints_by_id = %{
        "tp1" => %Timepoint{id: "tp1", name: "tp1 name"},
        "tp2" => %Timepoint{id: "tp2", name: "tp2 name"},
        "tp3" => %Timepoint{id: "tp3", name: "tp3 name"},
        "tp4" => %Timepoint{id: "tp4", name: "tp4 name"}
      }

      assert Data.timepoints_for_route(route_patterns, "r1", stop_times_by_id, timepoints_by_id) ==
               [
                 %Timepoint{id: "tp1", name: "tp1 name"},
                 %Timepoint{id: "tp2", name: "tp2 name"},
                 %Timepoint{id: "tp3", name: "tp3 name"},
                 %Timepoint{id: "tp4", name: "tp4 name"}
               ]
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

  describe "timepoint_name_for_id/2" do
    test "looks up the timepoint name" do
      data = %Data{
        timepoint_names_by_id: %{
          "hynes" => "Hynes Convention Center"
        }
      }

      assert Data.timepoint_name_for_id(data, "hynes") == "Hynes Convention Center"
      assert Data.timepoint_name_for_id(data, "rugg") == nil
    end
  end
end
