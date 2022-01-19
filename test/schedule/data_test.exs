defmodule Schedule.DataTest do
  use ExUnit.Case, async: true

  import Skate.Factory

  alias Schedule.AsDirected
  alias Schedule.Block
  alias Schedule.Break
  alias Schedule.Data
  alias Schedule.Swing
  alias Schedule.Gtfs.{Route, RoutePattern, Shape, Stop, StopTime, Timepoint}
  alias Schedule.Gtfs.Shape.Point
  alias Schedule.Hastus
  alias Schedule.Hastus.Activity
  alias Schedule.Piece
  alias Schedule.Run

  @default_tables %{
    routes: :routes_test,
    route_patterns: :route_patterns_test,
    timepoints_by_route: :timepoints_by_route_test,
    timepoint_names_by_id: :timepoint_names_by_id_test,
    shapes: :shapes_test,
    stops: :stops_test,
    trips: :trips_test,
    blocks: :blocks_test,
    calendar: :calendar_test,
    runs: :run_test,
    swings: :swings_test
  }

  setup do
    :ok = Data.initialize_tables(@default_tables)

    on_exit(fn ->
      :ok = Data.drop_tables(@default_tables)
    end)

    {:ok, tables: @default_tables}
  end

  test "all_routes/1 returns all the routes", %{tables: tables} do
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

    Data.save_schedule_data_to_tables(tables, data)

    assert Data.all_routes(tables) == routes
  end

  describe "timepoints_on_route/2" do
    test "returns the timepoints for the given route ID", %{tables: tables} do
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

      Data.save_schedule_data_to_tables(tables, data)

      assert Data.timepoints_on_route(tables, "1") == [
               %Timepoint{id: "t1", name: "t1 name"},
               %Timepoint{id: "t2", name: "t2 name"},
               %Timepoint{id: "t3", name: "t3 name"},
               %Timepoint{id: "t4", name: "t4 name"}
             ]
    end

    test "returns an empty list if the route ID isn't found", %{tables: tables} do
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

      Data.save_schedule_data_to_tables(tables, data)

      assert Data.timepoints_on_route(tables, "2") == []
    end
  end

  describe "stop/2" do
    test "returns the stop for the given stop ID", %{tables: tables} do
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

      Data.save_schedule_data_to_tables(tables, data)

      assert Data.stop(tables, "2") == %Stop{
               id: "2",
               name: "Two",
               parent_station_id: "3"
             }
    end

    test "returns nil if the given stop ID is not found", %{tables: tables} do
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

      Data.save_schedule_data_to_tables(tables, data)

      assert Data.stop(tables, "4") == nil
    end
  end

  describe "trip" do
    test "trip/1 returns the trip", %{tables: tables} do
      data = %Data{
        trips: %{
          "t1" => %Schedule.Trip{
            id: "t1",
            block_id: "b"
          }
        }
      }

      Data.save_schedule_data_to_tables(tables, data)

      assert %Schedule.Trip{id: "t1"} = Data.trip(tables, "t1")
    end

    test "trip/1 returns nil if the trip doesn't exist", %{tables: tables} do
      assert Data.trip(tables, "t1") == nil
    end
  end

  describe "trips_by_id/2" do
    test "returns trips specified by ID", %{tables: tables} do
      data = %Data{
        trips: %{
          "t1" => %Schedule.Trip{
            id: "t1",
            block_id: "b"
          },
          "t2" => %Schedule.Trip{
            id: "t2",
            block_id: "b"
          },
          "t3" => %Schedule.Trip{
            id: "t3",
            block_id: "b"
          }
        }
      }

      Data.save_schedule_data_to_tables(tables, data)

      trips = Data.trips_by_id(tables, ["t1", "t2"])
      assert Enum.count(trips) == 2

      trip_ids = Map.keys(trips)
      assert "t1" in trip_ids
      assert "t2" in trip_ids
    end
  end

  describe "block" do
    test "block returns the block", %{tables: tables} do
      block = build(:block)

      data = %Data{
        blocks: %{{"block", "service"} => block}
      }

      Data.save_schedule_data_to_tables(tables, data)

      assert Data.block(tables, "block", "service") == block
    end

    test "block doesn't return blocks with the same block_id but a different date", %{
      tables: tables
    } do
      block = build(:block)

      data = %Data{
        blocks: %{{"block", "service"} => block}
      }

      Data.save_schedule_data_to_tables(tables, data)

      assert Data.block(tables, "b", "other_service") == nil
    end

    @tag skip: "not yet migrated"
    test "block returns nil if the block doesn't exist", %{tables: tables} do
      assert Data.block(tables, "block", "service") == nil
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
    test "returns an active trip", %{tables: tables} do
      trip = %Schedule.Trip{
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

      Data.save_schedule_data_to_tables(tables, data)

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800
      assert Data.active_trips(tables, time0 + 2, time0 + 5) == [trip]
    end

    test "doesn't return a trip active at a different time today", %{tables: tables} do
      trip = %Schedule.Trip{
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

      Data.save_schedule_data_to_tables(tables, data)

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800
      assert Data.active_trips(tables, time0 + 1, time0 + 2) == []
    end

    test "doesn't return a trip active at this time on a different day", %{tables: tables} do
      trip = %Schedule.Trip{
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

      Data.save_schedule_data_to_tables(tables, data)

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800
      assert Data.active_trips(tables, time0 + 1, time0 + 3) == []
    end

    test "returns late-night trips that are still active from yesterday", %{tables: tables} do
      trip = %Schedule.Trip{
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

      Data.save_schedule_data_to_tables(tables, data)

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800
      assert Data.active_trips(tables, time0 + 1, time0 + 3) == [trip]
    end
  end

  describe "active_blocks" do
    test "returns active blocks", %{tables: tables} do
      block =
        build(
          :block,
          service_id: "today",
          start_time: 3,
          end_time: 4
        )

      data = %Data{
        blocks: %{
          {"block", "today"} => block
        },
        calendar: %{
          ~D[2019-01-01] => ["today"]
        }
      }

      Data.save_schedule_data_to_tables(tables, data)

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800

      assert Data.active_blocks(tables, time0 + 2, time0 + 5) == %{~D[2019-01-01] => [block]}
    end

    test "doesn't return inactive blocks", %{tables: tables} do
      block =
        build(
          :block,
          service_id: "today",
          start_time: 3,
          end_time: 4
        )

      data = %Data{
        blocks: %{
          {"block", "today"} => block
        },
        calendar: %{
          ~D[2019-01-01] => ["today"]
        }
      }

      Data.save_schedule_data_to_tables(tables, data)

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800

      assert Data.active_blocks(tables, time0 + 5, time0 + 5) == %{}
    end

    test "blocks can be active on two different dates", %{tables: tables} do
      just_before_midnight = 24 * 60 * 60 - 1

      block1 =
        build(
          :block,
          service_id: "today",
          start_time: just_before_midnight,
          end_time: just_before_midnight
        )

      block2 =
        build(
          :block,
          service_id: "tomorrow",
          start_time: 1,
          end_time: 1
        )

      data = %Data{
        blocks: %{
          {block1.id, "today"} => block1,
          {block2.id, "tomorrow"} => block2
        },
        calendar: %{
          ~D[2019-01-01] => ["today"],
          ~D[2019-01-02] => ["tomorrow"]
        }
      }

      Data.save_schedule_data_to_tables(tables, data)

      # 2019-01-02 00:00:00 EST
      time0 = 1_546_405_200

      assert Data.active_blocks(tables, time0 - 2, time0 + 2) == %{
               ~D[2019-01-01] => [block1],
               ~D[2019-01-02] => [block2]
             }
    end
  end

  describe "shapes" do
    test "returns the shapes for the given route", %{tables: tables} do
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

      Data.save_schedule_data_to_tables(tables, data)

      assert Data.shapes(tables, "route1") == shapes
    end

    test "returns [] if there are no shapes for the given route", %{tables: tables} do
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

      Data.save_schedule_data_to_tables(tables, data)

      assert Data.shapes(tables, "shapelessRoute") == []
    end
  end

  describe "shape_for_trip" do
    test "returns the shape for the given trip_id", %{tables: tables} do
      trip = %Schedule.Trip{
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

      Data.save_schedule_data_to_tables(tables, data)

      assert Data.shape_for_trip(tables, "trip") == shape
    end

    test "returns nil if there is no shape", %{tables: tables} do
      trip = %Schedule.Trip{
        id: "trip",
        block_id: "block",
        route_id: "route",
        shape_id: "shape"
      }

      data = %Data{
        trips: %{"trip" => trip}
      }

      Data.save_schedule_data_to_tables(tables, data)

      assert Data.shape_for_trip(tables, "trip") == nil
    end

    test "returns nil if there is no trip", %{tables: tables} do
      assert Data.shape_for_trip(tables, "trip") == nil
    end
  end

  describe "first_route_pattern_for_route_and_direction/3" do
    setup %{tables: tables} do
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

      Data.save_schedule_data_to_tables(tables, data)

      {:ok, tables: tables}
    end

    test "returns the first route pattern matching the route and direction", %{tables: tables} do
      assert Data.first_route_pattern_for_route_and_direction(tables, "r1", 0) == %RoutePattern{
               id: "1",
               name: "Route Pattern 1",
               route_id: "r1",
               direction_id: 0,
               representative_trip_id: "t1"
             }
    end

    test "returns nil if no route patterns match", %{tables: tables} do
      assert Data.first_route_pattern_for_route_and_direction(tables, "r2", 1) == nil
    end
  end

  describe "run_for_trip/3" do
    test "returns run with ID for trip", %{tables: tables} do
      trip =
        build(:trip, %{
          id: "trip",
          block_id: "block",
          schedule_id: "schedule",
          run_id: "run"
        })

      run =
        build(:run, %{
          schedule_id: "schedule",
          id: "run",
          activities: []
        })

      data = %Data{
        trips: %{trip.id => trip},
        runs: %{Run.key(run) => run}
      }

      Data.save_schedule_data_to_tables(tables, data)

      assert Data.run_for_trip(tables, trip.run_id, trip.id) == run
    end

    test "returns run from trip without specific run ID", %{tables: tables} do
      trip =
        build(:trip, %{
          id: "trip",
          block_id: "block",
          schedule_id: "schedule",
          run_id: "run"
        })

      run =
        build(:run, %{
          schedule_id: "schedule",
          id: "run",
          activities: []
        })

      data = %Data{
        trips: %{trip.id => trip},
        runs: %{Run.key(run) => run}
      }

      Data.save_schedule_data_to_tables(tables, data)

      assert Data.run_for_trip(tables, nil, trip.id) == run
    end

    test "returns nil if the trip isn't known", %{tables: tables} do
      assert Data.run_for_trip(tables, "run", "trip") == nil
    end

    test "returns nil if the trip is in GTFS but not HASTUS (no schedule_id)", %{tables: tables} do
      trip =
        build(:trip, %{
          id: "trip",
          block_id: "block",
          schedule_id: nil,
          run_id: "run"
        })

      data = %Data{
        trips: %{trip.id => trip}
      }

      Data.save_schedule_data_to_tables(tables, data)

      assert Data.run_for_trip(tables, trip.run_id, trip.id) == nil
    end
  end

  describe "block_for_trip/2" do
    test "returns block for trip", %{tables: tables} do
      trip = build(:trip, schedule_id: "schedule_q", block_id: "some_block")

      block =
        build(:block,
          id: "some_block",
          schedule_id: "schedule_q",
          pieces: [build(:piece, trips: [trip])]
        )

      data = %Data{
        trips: %{trip.id => trip},
        blocks: %{Block.key(block) => block}
      }

      Data.save_schedule_data_to_tables(tables, data)

      assert Data.block_for_trip(tables, trip.id) == block
    end

    test "returns nil if the trip isn't known", %{tables: tables} do
      assert Data.block_for_trip(tables, "trip") == nil
    end

    test "returns nil if the trip is in gtfs but not hastus", %{tables: tables} do
      trip =
        build(:trip,
          schedule_id: nil
        )

      data = %Data{
        trips: %{trip.id => trip}
      }

      Data.save_schedule_data_to_tables(tables, data)

      assert Data.block_for_trip(tables, trip.id) == nil
    end
  end

  describe "swings_for_route/4" do
    @tag skip: "not yet migrated"
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

  @tag skip: "not yet migrated"
  describe "parse_files/1" do
    @tag skip: "not yet migrated"
    test "includes certain hardcoded garage IDs as checkpoints" do
      hardcoded_garage_ids =
        Data.parse_files(%{gtfs: %{}, hastus: %{}})
        |> Map.get(:timepoint_names_by_id)
        |> Map.keys()
        |> Enum.sort()

      assert hardcoded_garage_ids == ~w[cabot charl fell lynn ncamb prwb somvl]
    end
  end

  @tag skip: "not yet migrated"
  describe "runs_from_hastus/4" do
    @tag skip: "not yet migrated"
    test "trips become pieces in run" do
      activities = [
        build(
          :hastus_activity,
          start_time: 1,
          end_time: 2,
          start_place: "start_place",
          end_place: "end_place"
        )
      ]

      trips = [
        build(
          :hastus_trip,
          start_time: 1,
          end_time: 2,
          start_place: "start_place",
          end_place: "end_place",
          trip_id: "trip"
        )
      ]

      timepoint_names_by_id = %{
        "start_place" => "Starting Line",
        "end_place" => "Finish Line"
      }

      schedule_trip =
        build(:trip,
          id: "trip",
          start_place: "start_place",
          end_place: "end_place",
          pretty_start_place: "Starting Line",
          pretty_end_place: "Finish Line"
        )

      expected_piece = %Piece{
        schedule_id: "schedule",
        run_id: "run",
        block_id: "block",
        start_time: 1,
        start_place: "Starting Line",
        trips: [schedule_trip],
        end_time: 2,
        end_place: "Finish Line"
      }

      assert Data.runs_from_hastus(
               activities,
               trips,
               %{"trip" => schedule_trip},
               timepoint_names_by_id
             ) == %{
               {"schedule", "run"} => %Run{
                 schedule_id: "schedule",
                 id: "run",
                 activities: [expected_piece],
                 service_id: schedule_trip.service_id
               }
             }
    end

    test "can have multiple pieces in run and block" do
      activities = [
        build(
          :hastus_activity,
          run_id: "run_1",
          start_time: 0,
          end_time: 0,
          start_place: "",
          end_place: "",
          partial_block_id: "block_1"
        ),
        build(
          :hastus_activity,
          run_id: "run_1",
          start_time: 0,
          end_time: 0,
          start_place: "",
          end_place: "",
          partial_block_id: "block_2"
        ),
        build(
          :hastus_activity,
          run_id: "run_2",
          start_time: 0,
          end_time: 0,
          start_place: "",
          end_place: "",
          partial_block_id: "block_1"
        )
      ]

      trips = [
        build(
          :hastus_trip,
          run_id: "run_1",
          block_id: "block_1",
          start_time: 0,
          end_time: 0,
          start_place: "",
          end_place: "",
          route_id: nil,
          trip_id: "trip_11"
        ),
        build(
          :hastus_trip,
          run_id: "run_1",
          block_id: "block_2",
          start_time: 0,
          end_time: 0,
          start_place: "",
          end_place: "",
          route_id: nil,
          trip_id: "trip_12"
        ),
        build(
          :hastus_trip,
          run_id: "run_2",
          block_id: "block_1",
          start_time: 0,
          end_time: 0,
          start_place: "",
          end_place: "",
          route_id: nil,
          trip_id: "trip_21"
        )
      ]

      schedule_trip_11 =
        build(
          :trip,
          id: "trip_11"
        )

      schedule_trip_12 =
        build(
          :trip,
          id: "trip_12"
        )

      schedule_trip_21 =
        build(
          :trip,
          id: "trip_21"
        )

      schedule_trips_by_id = %{
        "trip_11" => schedule_trip_11,
        "trip_12" => schedule_trip_12,
        "trip_21" => schedule_trip_21
      }

      assert %{
               {"schedule", "run_1"} => %Run{
                 activities: [
                   %Piece{trips: [trip_11]},
                   %Piece{trips: [trip_12]}
                 ]
               },
               {"schedule", "run_2"} => %Run{
                 activities: [
                   %Piece{trips: [trip_21]}
                 ]
               }
             } = Data.runs_from_hastus(activities, trips, schedule_trips_by_id, %{})
    end

    @tag skip: "not yet migrated"
    test "a different schedule_id means a different run or block" do
      activities = [
        %Activity{
          schedule_id: "schedule_1",
          run_id: "run",
          start_time: 0,
          end_time: 0,
          start_place: "",
          end_place: "",
          activity_type: "Operator",
          partial_block_id: "block"
        },
        %Activity{
          schedule_id: "schedule_2",
          run_id: "run",
          start_time: 0,
          end_time: 0,
          start_place: "",
          end_place: "",
          activity_type: "Operator",
          partial_block_id: "block"
        }
      ]

      trips = [
        %Hastus.Trip{
          schedule_id: "schedule_1",
          run_id: "run",
          block_id: "block",
          start_time: 0,
          end_time: 0,
          start_place: "",
          end_place: "",
          route_id: nil,
          trip_id: "trip_1"
        },
        %Hastus.Trip{
          schedule_id: "schedule_2",
          run_id: "run",
          block_id: "block",
          start_time: 0,
          end_time: 0,
          start_place: "",
          end_place: "",
          route_id: nil,
          trip_id: "trip_2"
        }
      ]

      schedule_trip1 = build(:trip, id: "trip_1")
      schedule_trip2 = build(:trip, id: "trip_2")
      schedule_trips_by_id = %{"trip_1" => schedule_trip1, "trip_2" => schedule_trip2}

      assert %{
               {"schedule_1", "run"} => %Run{
                 activities: [%Piece{trips: [schedule_trip1]}]
               },
               {"schedule_2", "run"} => %Run{
                 activities: [%Piece{trips: [schedule_trip2]}]
               }
             } = Data.runs_from_hastus(activities, trips, schedule_trips_by_id, %{})
    end

    @tag skip: "not yet migrated"
    test "labels mid route swings" do
      activities = [
        %Activity{
          schedule_id: "schedule",
          run_id: "run1",
          start_time: 1,
          end_time: 3,
          start_place: "terminal1",
          end_place: "swing",
          activity_type: "Operator",
          partial_block_id: "block"
        },
        %Activity{
          schedule_id: "schedule",
          run_id: "run2",
          start_time: 2,
          end_time: 3,
          start_place: "swing",
          end_place: "swing",
          activity_type: "Sign-on"
        },
        %Activity{
          schedule_id: "schedule",
          run_id: "run2",
          start_time: 3,
          end_time: 6,
          start_place: "swing",
          end_place: "terminal1",
          activity_type: "Operator",
          partial_block_id: "block"
        }
      ]

      trips = [
        %Hastus.Trip{
          schedule_id: "schedule",
          run_id: "run1",
          block_id: "block",
          start_time: 1,
          end_time: 4,
          start_place: "terminal1",
          end_place: "terminal2",
          route_id: "route",
          trip_id: "trip1"
        },
        %Hastus.Trip{
          schedule_id: "schedule",
          run_id: "run2",
          block_id: "block",
          start_time: 5,
          end_time: 6,
          start_place: "terminal2",
          end_place: "terminal1",
          route_id: "route",
          trip_id: "trip2"
        }
      ]

      schedule_trip1 =
        build(:trip, id: "trip1", start_place: "swing_start", end_place: "swing_end")

      schedule_trip2 = build(:trip, id: "trip2")
      schedule_trips_by_id = %{"trip1" => schedule_trip1, "trip2" => schedule_trip2}

      expected_trip1 = %Schedule.Trip{
        schedule_trip1
        | pretty_start_place: "Swing Start Street",
          pretty_end_place: "Swing End Bend"
      }

      expected_trip2 = schedule_trip2

      timepoint_names_by_id = %{
        "swing_start" => "Swing Start Street",
        "swing_end" => "Swing End Bend"
      }

      expected_piece1 = %Piece{
        schedule_id: "schedule",
        run_id: "run1",
        block_id: "block",
        start_time: 1,
        start_place: "terminal1",
        trips: [expected_trip1],
        end_time: 3,
        end_place: "swing",
        start_mid_route?: nil,
        end_mid_route?: true
      }

      expected_piece2 = %Piece{
        schedule_id: "schedule",
        run_id: "run2",
        block_id: "block",
        start_time: 2,
        start_place: "swing",
        trips: [expected_trip2],
        end_time: 6,
        end_place: "terminal1",
        start_mid_route?: %{
          time: 3,
          trip: expected_trip1
        },
        end_mid_route?: false
      }

      assert Data.runs_from_hastus(activities, trips, schedule_trips_by_id, timepoint_names_by_id) ==
               %{
                 {"schedule", "run1"} => %Run{
                   schedule_id: "schedule",
                   service_id: schedule_trip1.service_id,
                   id: "run1",
                   activities: [expected_piece1]
                 },
                 {"schedule", "run2"} => %Run{
                   schedule_id: "schedule",
                   service_id: schedule_trip1.service_id,
                   id: "run2",
                   activities: [expected_piece2]
                 }
               }
    end
  end

  @tag skip: "not yet migrated"
  describe "run_from_hastus/6" do
    @tag skip: "not yet migrated"
    test "multiple trips are grouped into the same piece" do
      run_key = {"schedule", "run"}

      activities = [
        %Activity{
          schedule_id: "schedule",
          run_id: "run",
          start_time: 100,
          end_time: 105,
          start_place: "place1",
          end_place: "place3",
          activity_type: "Operator",
          partial_block_id: "lock"
        }
      ]

      trips = [
        %Hastus.Trip{
          schedule_id: "schedule",
          run_id: "run",
          block_id: "block",
          start_time: 100,
          end_time: 102,
          start_place: "place1",
          end_place: "place2",
          route_id: "route",
          trip_id: "trip1"
        },
        %Hastus.Trip{
          schedule_id: "schedule",
          run_id: "run",
          block_id: "block",
          start_time: 103,
          end_time: 105,
          start_place: "place2",
          end_place: "place3",
          trip_id: "trip2"
        }
      ]

      schedule_trip1 = build(:trip, id: "trip1", start_place: "place1", end_place: "place2")
      schedule_trip2 = build(:trip, id: "trip2", start_place: "place2", end_place: "place3")
      schedule_trips_by_id = %{"trip1" => schedule_trip1, "trip2" => schedule_trip2}

      timepoint_names_by_id = %{
        "place1" => "The Good Place",
        "place2" => "The Medium Place",
        "place3" => "The Bad Place"
      }

      expected_trip1 = %Schedule.Trip{
        schedule_trip1
        | pretty_start_place: "The Good Place",
          pretty_end_place: "The Medium Place"
      }

      expected_trip2 = %Schedule.Trip{
        schedule_trip2
        | pretty_start_place: "The Medium Place",
          pretty_end_place: "The Bad Place"
      }

      expected_run = %Run{
        id: "run",
        schedule_id: "schedule",
        service_id: schedule_trip1.service_id,
        activities: [
          %Piece{
            schedule_id: "schedule",
            run_id: "run",
            block_id: "block",
            start_time: 100,
            start_place: "The Good Place",
            trips: [
              expected_trip1,
              expected_trip2
            ],
            end_time: 105,
            end_place: "The Bad Place"
          }
        ]
      }

      assert Data.run_from_hastus(
               run_key,
               activities,
               trips,
               %{},
               schedule_trips_by_id,
               timepoint_names_by_id
             ) ==
               expected_run
    end

    @tag skip: "not yet migrated"
    test "trips become multiple pieces if there are multiple Operator activities" do
      run_key = {"schedule", "run"}

      activities = [
        %Activity{
          schedule_id: "schedule",
          run_id: "run",
          start_time: 101,
          end_time: 102,
          start_place: "",
          end_place: "",
          activity_type: "Operator",
          partial_block_id: "lock"
        },
        %Activity{
          schedule_id: "schedule",
          run_id: "run",
          start_time: 103,
          end_time: 104,
          start_place: "",
          end_place: "",
          activity_type: "Operator",
          partial_block_id: "lock"
        }
      ]

      trips = [
        %Hastus.Trip{
          schedule_id: "schedule",
          run_id: "run",
          block_id: "block",
          start_time: 101,
          end_time: 102,
          start_place: "",
          end_place: "",
          trip_id: "trip1"
        },
        %Hastus.Trip{
          schedule_id: "schedule",
          run_id: "run",
          block_id: "block",
          start_time: 103,
          end_time: 104,
          start_place: "",
          end_place: "",
          trip_id: "trip2"
        }
      ]

      schedule_trip1 = build(:trip, id: "trip1")
      schedule_trip2 = build(:trip, id: "trip2")
      schedule_trips_by_id = %{"trip1" => schedule_trip1, "trip2" => schedule_trip2}

      assert %Run{
               activities: [
                 %Piece{
                   block_id: "block",
                   start_time: 101,
                   trips: [schedule_trip1],
                   end_time: 102
                 } = _,
                 %Piece{
                   block_id: "block",
                   start_time: 103,
                   trips: [schedule_trip2],
                   end_time: 104
                 } = _
               ]
             } = Data.run_from_hastus(run_key, activities, trips, %{}, schedule_trips_by_id, %{})
    end

    @tag skip: "not yet migrated"
    test "Deadhead from becomes part of following piece as a trip" do
      run_key = {"schedule", "run"}

      activities = [
        %Activity{
          schedule_id: "schedule",
          run_id: "run",
          start_time: 101,
          end_time: 102,
          start_place: "",
          end_place: "",
          activity_type: "Deadhead from"
        },
        %Activity{
          schedule_id: "schedule",
          run_id: "run",
          start_time: 102,
          end_time: 103,
          start_place: "",
          end_place: "",
          activity_type: "Operator",
          partial_block_id: "block"
        }
      ]

      trips = [
        %Hastus.Trip{
          schedule_id: "schedule",
          run_id: "run",
          block_id: "block",
          start_time: 102,
          end_time: 103,
          start_place: "start_place",
          end_place: "end_place",
          route_id: nil,
          trip_id: "trip"
        }
      ]

      schedule_trip = build(:trip, id: "trip")

      assert %Run{
               activities: [
                 %Piece{
                   start_time: 101,
                   trips: [
                     %Schedule.Trip{
                       block_id: "block",
                       direction_id: nil,
                       end_time: 102,
                       headsign: nil,
                       id: "leading_deadhead_run_101"
                     },
                     schedule_trip
                   ],
                   end_time: 103,
                   schedule_id: "schedule",
                   run_id: "run"
                 }
               ]
             } =
               Data.run_from_hastus(
                 run_key,
                 activities,
                 trips,
                 %{},
                 %{"trip" => schedule_trip},
                 %{}
               )
    end

    @tag skip: "not yet migrated"
    test "Deadhead to becomes part of previous piece" do
      run_key = {"schedule", "run"}

      activities = [
        %Activity{
          schedule_id: "schedule",
          run_id: "run",
          start_time: 101,
          end_time: 102,
          start_place: "",
          end_place: "",
          activity_type: "Operator",
          partial_block_id: "block"
        },
        %Activity{
          schedule_id: "schedule",
          run_id: "run",
          start_time: 102,
          end_time: 103,
          start_place: "",
          end_place: "",
          activity_type: "Deadhead to"
        }
      ]

      trips = [
        %Hastus.Trip{
          schedule_id: "schedule",
          run_id: "run",
          block_id: "block",
          start_time: 101,
          end_time: 102,
          start_place: "start_place",
          end_place: "end_place",
          route_id: nil,
          trip_id: "trip"
        }
      ]

      schedule_trip = build(:trip, id: "trip")

      assert %Run{
               activities: [
                 %Piece{
                   start_time: 101,
                   trips: [
                     schedule_trip,
                     %Schedule.Trip{
                       id: "following_deadhead_run_102",
                       block_id: "block",
                       direction_id: nil,
                       start_time: 102,
                       end_time: 103
                     }
                   ],
                   end_time: 103,
                   run_id: "run",
                   block_id: "block",
                   schedule_id: "schedule"
                 }
               ]
             } =
               Data.run_from_hastus(
                 run_key,
                 activities,
                 trips,
                 %{},
                 %{"trip" => schedule_trip},
                 %{}
               )
    end

    @tag skip: "not yet migrated"
    test "piece start time is based on sign_on activity" do
      run_key = {"schedule", "run"}

      activities = [
        %Activity{
          schedule_id: "schedule",
          run_id: "run",
          start_time: 101,
          end_time: 102,
          start_place: "",
          end_place: "",
          activity_type: "Sign-on"
        },
        %Activity{
          schedule_id: "schedule",
          run_id: "run",
          start_time: 102,
          end_time: 103,
          start_place: "",
          end_place: "",
          activity_type: "Operator",
          partial_block_id: "block"
        }
      ]

      trips = []

      assert %Run{
               activities: [
                 %Piece{
                   start_time: 101,
                   end_time: 103
                 }
               ]
             } = Data.run_from_hastus(run_key, activities, trips, %{}, %{}, %{})
    end

    @tag skip: "not yet migrated"
    test "makes as directed pieces when given rad/wad activities" do
      run_key = {"aba20l31", "123-1502"}

      activities = [
        %Activity{
          schedule_id: "aba20l31",
          run_id: "123-1502",
          start_time: 15600,
          end_time: 16200,
          start_place: "alban",
          end_place: "alban",
          activity_type: "Sign-on"
        },
        %Activity{
          schedule_id: "aba20l31",
          run_id: "123-1502",
          start_time: 16200,
          end_time: 44400,
          start_place: "alban",
          end_place: "alban",
          activity_type: "wad"
        }
      ]

      trips = []

      assert %Run{
               activities: [
                 %Piece{
                   block_id: nil,
                   start_time: 15600,
                   trips: [
                     %AsDirected{
                       kind: :wad,
                       start_time: 16200,
                       end_time: 44400
                     }
                   ],
                   end_time: 44400
                 }
               ]
             } = Data.run_from_hastus(run_key, activities, trips, %{}, %{}, %{})
    end

    @tag skip: "not yet migrated"
    test "makes as directed pieces when given rad/wad trips" do
      run_key = {"abc20011", "123-9073"}

      activities = [
        %Activity{
          schedule_id: "abc20011",
          run_id: "123-9073",
          start_time: 21000,
          end_time: 21600,
          start_place: "cabot",
          end_place: "cabot",
          activity_type: "Sign-on"
        },
        %Activity{
          schedule_id: "abc20011",
          run_id: "123-9073",
          start_time: 21600,
          end_time: 32400,
          start_place: "cabot",
          end_place: "cabot",
          activity_type: "Operator",
          partial_block_id: "rad-340"
        }
      ]

      trips = [
        %Hastus.Trip{
          schedule_id: "abc20011",
          run_id: "123-9073",
          block_id: "Crad-340",
          start_time: 21600,
          end_time: 21600,
          start_place: "cabot",
          end_place: "cabot",
          route_id: nil,
          trip_id: "43756185"
        },
        %Hastus.Trip{
          schedule_id: "abc20011",
          run_id: "123-9073",
          block_id: "Crad-340",
          start_time: 21600,
          end_time: 32400,
          start_place: "cabot",
          end_place: "cabot",
          route_id: "rad",
          trip_id: "43753838"
        },
        %Hastus.Trip{
          schedule_id: "abc20011",
          run_id: "123-9073",
          block_id: "Crad-340",
          start_time: 32400,
          end_time: 32400,
          start_place: "cabot",
          end_place: "cabot",
          route_id: nil,
          trip_id: "43756526"
        }
      ]

      assert %Run{
               activities: [
                 %Piece{
                   block_id: "Crad-340",
                   start_time: 21000,
                   trips: [
                     %AsDirected{
                       kind: :rad,
                       start_time: 21600,
                       end_time: 32400
                     }
                   ],
                   end_time: 32400
                 }
               ]
             } = Data.run_from_hastus(run_key, activities, trips, %{}, %{}, %{})
    end

    @tag skip: "not yet migrated"
    test "makes breaks" do
      run_key = {"schedule", "run"}

      activities = [
        %Activity{
          schedule_id: "schedule",
          run_id: "run",
          start_time: 101,
          end_time: 102,
          start_place: "start place",
          end_place: "end place",
          activity_type: "Paid meal after"
        }
      ]

      trips = []

      expected_break = %Break{
        break_type: "Paid meal after",
        start_time: 101,
        end_time: 102,
        start_place: "start place",
        end_place: "end place"
      }

      assert Data.run_from_hastus(run_key, activities, trips, %{}, %{}, %{}).activities == [
               expected_break
             ]
    end

    @tag skip: "not yet migrated"
    test "assigns service_id when there is a unique value" do
      run_key = {"schedule", "run"}

      activities = [
        build(:hastus_activity, %{end_place: "place3"})
      ]

      trips = [
        build(:hastus_trip),
        build(
          :hastus_trip,
          %{
            start_time: 103,
            end_time: 105,
            start_place: "place2",
            end_place: "place3",
            trip_id: "trip2"
          }
        )
      ]

      trips_by_id = %{
        "trip1" => build(:trip, %{id: "trip1"}),
        "trip2" => build(:trip, %{id: "trip2"})
      }

      expected_run = %Run{
        id: "run",
        schedule_id: "schedule",
        service_id: "service",
        activities: [
          %Piece{
            schedule_id: "schedule",
            run_id: "run",
            block_id: "block",
            start_time: 100,
            start_place: "place1",
            trips: [
              %Schedule.Trip{
                block_id: "block",
                direction_id: 0,
                end_time: 200,
                headsign: "headsign",
                id: "trip1",
                route_id: "route",
                run_id: "run",
                service_id: "service",
                start_time: 100,
                stop_times: [
                  %Schedule.Gtfs.StopTime{stop_id: "stop1", time: 150, timepoint_id: "t1"}
                ]
              },
              %Schedule.Trip{
                block_id: "block",
                direction_id: 0,
                end_time: 200,
                headsign: "headsign",
                id: "trip2",
                route_id: "route",
                run_id: "run",
                service_id: "service",
                start_time: 100,
                stop_times: [
                  %Schedule.Gtfs.StopTime{stop_id: "stop1", time: 150, timepoint_id: "t1"}
                ]
              }
            ],
            end_time: 105,
            end_place: "place3"
          }
        ]
      }

      assert Data.run_from_hastus(run_key, activities, trips, %{}, trips_by_id, %{}) ==
               expected_run
    end

    @tag skip: "not yet migrated"
    test "leaves service_id nil whem multiple competing values are present" do
      run_key = {"schedule", "run"}

      activities = [
        build(:hastus_activity, %{end_place: "place3"})
      ]

      trips = [
        build(:hastus_trip),
        build(
          :hastus_trip,
          %{
            start_time: 103,
            end_time: 105,
            start_place: "place2",
            end_place: "place3",
            trip_id: "trip2"
          }
        )
      ]

      trips_by_id = %{
        "trip1" => build(:trip, %{id: "trip1", service_id: "service1"}),
        "trip2" => build(:trip, %{id: "trip2", service_id: "service2"})
      }

      expected_run = %Run{
        id: "run",
        schedule_id: "schedule",
        service_id: nil,
        activities: [
          %Piece{
            schedule_id: "schedule",
            run_id: "run",
            block_id: "block",
            start_time: 100,
            start_place: "place1",
            trips: [
              %Schedule.Trip{
                block_id: "block",
                direction_id: 0,
                end_time: 200,
                headsign: "headsign",
                id: "trip1",
                pretty_end_place: nil,
                pretty_start_place: nil,
                route_id: "route",
                run_id: "run",
                service_id: "service1",
                start_time: 100,
                stop_times: [
                  %Schedule.Gtfs.StopTime{stop_id: "stop1", time: 150, timepoint_id: "t1"}
                ]
              },
              %Schedule.Trip{
                block_id: "block",
                direction_id: 0,
                end_time: 200,
                headsign: "headsign",
                id: "trip2",
                route_id: "route",
                run_id: "run",
                service_id: "service2",
                shape_id: nil,
                start_time: 100,
                stop_times: [
                  %Schedule.Gtfs.StopTime{stop_id: "stop1", time: 150, timepoint_id: "t1"}
                ]
              }
            ],
            end_time: 105,
            end_place: "place3"
          }
        ]
      }

      assert Data.run_from_hastus(run_key, activities, trips, %{}, trips_by_id, %{}) ==
               expected_run
    end
  end
end
