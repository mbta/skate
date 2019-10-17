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

  describe "active_trips_by_date" do
    test "returns active trips" do
      trips = [
        # A trip that's totally inside the time range
        %Trip{
          id: "inside",
          route_id: "route",
          service_id: "today",
          headsign: "headsign",
          direction_id: 0,
          block_id: "inside",
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
        },
        # A trip that start's before and ends after the timerange
        %Trip{
          id: "outside",
          route_id: "route",
          service_id: "today",
          headsign: "headsign",
          direction_id: 0,
          block_id: "outside",
          shape_id: "shape1",
          stop_times: [
            %StopTime{
              stop_id: "stop",
              time: 1
            },
            %StopTime{
              stop_id: "stop",
              time: 6
            }
          ]
        },
        # A trip that starts before the time range and ends during the time range
        %Trip{
          id: "start",
          route_id: "route",
          service_id: "today",
          headsign: "headsign",
          direction_id: 0,
          block_id: "start",
          shape_id: "shape1",
          stop_times: [
            %StopTime{
              stop_id: "stop",
              time: 1
            },
            %StopTime{
              stop_id: "stop",
              time: 3
            }
          ]
        },
        # A trip that starts during the time range and ends after
        %Trip{
          id: "end",
          route_id: "route",
          service_id: "today",
          headsign: "headsign",
          direction_id: 0,
          block_id: "end",
          shape_id: "shape1",
          stop_times: [
            %StopTime{
              stop_id: "stop",
              time: 4
            },
            %StopTime{
              stop_id: "stop",
              time: 6
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
        trips: Map.new(trips, fn trip -> {trip.id, trip} end),
        blocks: %{},
        calendar: %{
          ~D[2019-01-01] => ["today"]
        }
      }

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800

      actual_trips_by_date = Data.active_trips_by_date(data, time0 + 2, time0 + 5)
      # sort the trips before comparing so order doesn't matter
      actual_trips_by_date =
        Helpers.map_values(
          actual_trips_by_date,
          fn trips_on_date -> Enum.sort_by(trips_on_date, fn trip -> trip.id end) end
        )

      expected_trips_by_date = %{~D[2019-01-01] => Enum.sort_by(trips, fn trip -> trip.id end)}
      assert(actual_trips_by_date == expected_trips_by_date)
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
      assert Data.active_trips_by_date(data, time0 + 1, time0 + 2) == %{}
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
      assert Data.active_trips_by_date(data, time0 + 1, time0 + 3) == %{}
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
      assert Data.active_trips_by_date(data, time0 + 1, time0 + 3) == %{~D[2018-12-31] => [trip]}
    end
  end

  describe "active_trips" do
    test "returns active trips" do
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
            time: 2
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

      assert [%Trip{id: "trip"}] = Data.active_trips(data, time0 + 3)
    end
  end

  describe "active_blocks" do
    test "returns active blocks" do
      data = %Data{
        routes: [],
        route_patterns: [],
        timepoint_ids_by_route: %{},
        shapes: %{},
        stops: [],
        trips: %{
          "trip" => %Trip{
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
        },
        blocks: %{},
        calendar: %{
          ~D[2019-01-01] => ["today"]
        }
      }

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800

      assert Data.active_blocks(data, time0 + 2, time0 + 5) == %{"route" => ["block"]}
    end

    test "doesn't include blocks that are between trips" do
      data = %Data{
        routes: [],
        route_patterns: [],
        timepoint_ids_by_route: %{},
        shapes: %{},
        stops: [],
        trips: %{
          "before" => %Trip{
            id: "before",
            route_id: "route",
            service_id: "today",
            headsign: "headsign",
            direction_id: 0,
            block_id: "block",
            shape_id: "shape1",
            stop_times: [
              %StopTime{
                stop_id: "stop",
                time: 1
              }
            ]
          },
          "after" => %Trip{
            id: "before",
            route_id: "route",
            service_id: "today",
            headsign: "headsign",
            direction_id: 0,
            block_id: "block",
            shape_id: "shape1",
            stop_times: [
              %StopTime{
                stop_id: "stop",
                time: 4
              }
            ]
          }
        },
        blocks: %{},
        calendar: %{
          ~D[2019-01-01] => ["today"]
        }
      }

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800
      assert Data.active_blocks(data, time0 + 2, time0 + 3) == %{}
    end

    test "returns a block in multiple routes if it's active in both" do
      data = %Data{
        routes: [],
        route_patterns: [],
        timepoint_ids_by_route: %{},
        shapes: %{},
        stops: [],
        trips: %{
          "first" => %Trip{
            id: "first",
            route_id: "first",
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
          "second" => %Trip{
            id: "second",
            route_id: "second",
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
        },
        blocks: %{},
        calendar: %{
          ~D[2019-01-01] => ["today"]
        }
      }

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800

      assert Data.active_blocks(data, time0 + 1, time0 + 4) == %{
               "first" => ["block"],
               "second" => ["block"]
             }
    end

    test "returns a block only once per route if it has multiple active trips" do
      data = %Data{
        routes: [],
        route_patterns: [],
        timepoint_ids_by_route: %{},
        shapes: %{},
        stops: [],
        trips: %{
          "first" => %Trip{
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
          "second" => %Trip{
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
        },
        blocks: %{},
        calendar: %{
          ~D[2019-01-01] => ["today"]
        }
      }

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800
      assert Data.active_blocks(data, time0 + 1, time0 + 4) == %{"route" => ["block"]}
    end
  end

  describe "shapes" do
    test "returns the shapes for the given shuttle route" do
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

    test "returns nil if there are no shapes for the given route" do
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

      assert Data.shapes(data, "shapelessRoute") == nil
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
