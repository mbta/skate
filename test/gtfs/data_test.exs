defmodule Gtfs.DataTest do
  use ExUnit.Case, async: true

  alias Gtfs.{Block, Data, Route, RoutePattern, Shape, Stop, StopTime, Trip}
  alias Gtfs.Shape.Point

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
      routes: routes,
      route_patterns: [],
      timepoint_ids_by_route: %{},
      shapes: %{},
      stops: %{},
      trips: %{},
      blocks: %{},
      calendar: %{}
    }

    assert Data.all_routes(data) == routes
  end

  describe "timepoint_ids_on_route/2" do
    test "returns the timepoints for the given route ID" do
      data = %Data{
        routes: [],
        route_patterns: [],
        timepoint_ids_by_route: %{
          "1" => ["t1", "t2", "t3", "t4"]
        },
        shapes: %{},
        stops: %{},
        trips: %{},
        blocks: %{},
        calendar: %{}
      }

      assert Data.timepoint_ids_on_route(data, "1") == ["t1", "t2", "t3", "t4"]
    end

    test "returns an empty list if the route ID isn't found" do
      data = %Data{
        routes: [],
        route_patterns: [],
        timepoint_ids_by_route: %{
          "1" => ["t1", "t2", "t3", "t4"]
        },
        shapes: %{},
        stops: %{},
        trips: %{},
        blocks: %{},
        calendar: %{}
      }

      assert Data.timepoint_ids_on_route(data, "2") == []
    end
  end

  describe "stop/2" do
    test "returns the stop for the given stop ID" do
      data = %Data{
        routes: [],
        route_patterns: [],
        timepoint_ids_by_route: %{},
        shapes: %{},
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
        blocks: %{},
        calendar: %{}
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
        timepoint_ids_by_route: %{},
        shapes: %{},
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
        blocks: %{},
        calendar: %{}
      }

      assert Data.stop(data, "4") == nil
    end
  end

  describe "trip" do
    test "trip/1 returns the trip" do
      data = %Data{
        routes: [],
        route_patterns: [],
        timepoint_ids_by_route: %{},
        shapes: %{},
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
            shape_id: "shape1",
            stop_times: [
              %StopTime{stop_id: "s1", time: 1, timepoint_id: nil}
            ]
          }
        },
        blocks: %{},
        calendar: %{}
      }

      assert %Trip{id: "t1"} = Data.trip(data, "t1")
    end

    test "trip/1 returns nil if the trip doesn't exist" do
      data = %Data{
        routes: [],
        route_patterns: [],
        timepoint_ids_by_route: %{},
        shapes: %{},
        stops: %{},
        trips: %{},
        blocks: %{},
        calendar: %{}
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
        shape_id: "shape1",
        stop_times: [
          %StopTime{stop_id: "s1", time: 1, timepoint_id: nil}
        ]
      }

      data = %Data{
        routes: [],
        route_patterns: [],
        timepoint_ids_by_route: %{},
        shapes: %{},
        stops: %{},
        trips: %{},
        blocks: Block.group_trips_by_block([trip]),
        calendar: %{}
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
        shape_id: "shape1",
        stop_times: [
          %StopTime{stop_id: "s1", time: 1, timepoint_id: nil}
        ]
      }

      data = %Data{
        routes: [],
        route_patterns: [],
        timepoint_ids_by_route: %{},
        shapes: %{},
        stops: %{},
        trips: %{},
        blocks: Block.group_trips_by_block([trip]),
        calendar: %{}
      }

      assert Data.block(data, "b", "other_service") == nil
    end

    test "block returns nil if the block doesn't exist" do
      data = %Data{
        routes: [],
        route_patterns: [],
        timepoint_ids_by_route: %{},
        shapes: %{},
        stops: %{},
        trips: %{},
        blocks: %{},
        calendar: %{}
      }

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
        route_id: "route",
        service_id: "today",
        headsign: "headsign",
        direction_id: 0,
        block_id: "active",
        shape_id: "shape",
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

      data = %Data{
        routes: [],
        route_patterns: [],
        timepoint_ids_by_route: %{},
        shapes: %{},
        stops: [],
        trips: %{trip.id => trip},
        blocks: %{},
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
        route_id: "route",
        service_id: "today",
        headsign: "headsign",
        direction_id: 0,
        block_id: "block",
        shape_id: "shape1",
        stop_times: [
          %StopTime{
            stop_id: "stop",
            time: 3
          }
        ]
      }

      data = %Data{
        routes: [],
        route_patterns: [],
        timepoint_ids_by_route: %{},
        shapes: %{},
        stops: [],
        trips: %{
          "trip" => trip
        },
        blocks: %{},
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
        route_id: "route",
        service_id: "tomorrow",
        headsign: "headsign",
        direction_id: 0,
        block_id: "block",
        shape_id: "shape1",
        stop_times: [
          %StopTime{
            stop_id: "stop",
            time: 2
          }
        ]
      }

      data = %Data{
        routes: [],
        route_patterns: [],
        timepoint_ids_by_route: %{},
        shapes: %{},
        stops: [],
        trips: %{
          "trip" => trip
        },
        blocks: %{},
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
        route_id: "route",
        service_id: "yesterday",
        headsign: "headsign",
        direction_id: 0,
        block_id: "block",
        shape_id: "shape1",
        stop_times: [
          %StopTime{
            stop_id: "stop",
            # 24:00:02
            time: 86402
          }
        ]
      }

      data = %Data{
        routes: [],
        route_patterns: [],
        timepoint_ids_by_route: %{},
        shapes: %{},
        stops: [],
        trips: %{
          "trip" => trip
        },
        blocks: %{},
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
          route_id: "route",
          service_id: "today",
          headsign: "headsign",
          direction_id: 0,
          block_id: "block",
          shape_id: "shape1",
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

      data = %Data{
        routes: [],
        route_patterns: [],
        timepoint_ids_by_route: %{},
        shapes: %{},
        stops: [],
        trips: %{},
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
        routes: [],
        route_patterns: [],
        timepoint_ids_by_route: %{},
        shapes: %{},
        stops: [],
        trips: %{},
        blocks: %{
          "block" => [
            %Trip{
              id: "trip",
              route_id: "route",
              service_id: "today",
              headsign: "headsign",
              direction_id: 0,
              block_id: "block",
              shape_id: "shape1",
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

    test "returns a block only once per route if it has multiple active trips" do
      block = [
        %Trip{
          id: "first",
          route_id: "route",
          service_id: "today",
          headsign: "headsign",
          direction_id: 0,
          block_id: "block",
          shape_id: "shape1",
          stop_times: [
            %StopTime{
              stop_id: "stop",
              time: 2
            }
          ]
        },
        %Trip{
          id: "second",
          route_id: "route",
          service_id: "today",
          headsign: "headsign",
          direction_id: 0,
          block_id: "block",
          shape_id: "shape1",
          stop_times: [
            %StopTime{
              stop_id: "stop",
              time: 3
            }
          ]
        }
      ]

      data = %Data{
        routes: [],
        route_patterns: [],
        timepoint_ids_by_route: %{},
        shapes: %{},
        stops: [],
        trips: %{},
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
      block1 = [
        %Trip{
          id: "first",
          route_id: "route",
          service_id: "today",
          headsign: "headsign1",
          direction_id: 0,
          block_id: "block",
          shape_id: "shape1",
          stop_times: [
            %StopTime{
              stop_id: "stop",
              time: 24 * 60 * 60 - 1
            }
          ]
        }
      ]

      block2 = [
        %Trip{
          id: "second",
          route_id: "route",
          service_id: "tomorrow",
          headsign: "headsign2",
          direction_id: 0,
          block_id: "block",
          shape_id: "shape1",
          stop_times: [
            %StopTime{
              stop_id: "stop",
              time: 1
            }
          ]
        }
      ]

      data = %Data{
        routes: [],
        route_patterns: [],
        timepoint_ids_by_route: %{},
        shapes: %{},
        stops: [],
        trips: %{},
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
        routes: [],
        route_patterns: [],
        timepoint_ids_by_route: %{},
        shapes: %{
          "route1" => shapes
        },
        stops: [],
        trips: %{},
        blocks: %{},
        calendar: %{}
      }

      assert Data.shapes(data, "route1") == shapes
    end

    test "returns [] if there are no shapes for the given route" do
      data = %Data{
        routes: [],
        route_patterns: [],
        timepoint_ids_by_route: %{},
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
        },
        stops: [],
        trips: %{},
        blocks: %{},
        calendar: %{}
      }

      assert Data.shapes(data, "shapelessRoute") == []
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
        routes: [],
        route_patterns: route_patterns,
        timepoint_ids_by_route: %{},
        shapes: %{},
        stops: [],
        trips: %{},
        blocks: %{},
        calendar: %{}
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

  describe "timepoint_ids_for_route/3" do
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

      trips = %{
        "t1" => %Trip{
          id: "t1",
          route_id: "r1",
          service_id: "service",
          headsign: "h1",
          direction_id: 0,
          block_id: "b1",
          route_pattern_id: "rp1",
          shape_id: "shape1",
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
          shape_id: "shape2",
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
          shape_id: "shape3",
          stop_times: [
            %StopTime{stop_id: "s4", time: 1, timepoint_id: "tp4"},
            %StopTime{stop_id: "s5", time: 2, timepoint_id: "tp1"}
          ]
        }
      }

      assert Data.timepoint_ids_for_route(route_patterns, "r1", trips) == ["tp4", "tp1"]
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

      trips = %{
        "t1" => %Trip{
          id: "t1",
          route_id: "r1",
          service_id: "service",
          headsign: "h1",
          direction_id: 1,
          block_id: "b1",
          route_pattern_id: "rp1",
          shape_id: "shape1",
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
          shape_id: "shape2",
          stop_times: [
            %StopTime{stop_id: "s1", time: 1, timepoint_id: "t1"},
            %StopTime{stop_id: "s2", time: 2, timepoint_id: "t2"},
            %StopTime{stop_id: "s3a", time: 3, timepoint_id: "t3"},
            %StopTime{stop_id: "s4", time: 4, timepoint_id: "t4"}
          ]
        }
      }

      assert Data.timepoint_ids_for_route(route_patterns, "r1", trips) == ["t1", "t2", "t3", "t4"]
    end
  end
end
