defmodule Schedule.Minischedule.LoadTest do
  use ExUnit.Case, async: true

  alias Schedule.Hastus.Activity
  alias Schedule.Hastus.Trip
  alias Schedule.Minischedule.AsDirected
  alias Schedule.Minischedule.Block
  alias Schedule.Minischedule.Break
  alias Schedule.Minischedule.Load
  alias Schedule.Minischedule.Piece
  alias Schedule.Minischedule.Run

  describe "from_hastus" do
    test "trips become pieces in run and block" do
      activities = [
        %Activity{
          schedule_id: "schedule",
          run_id: "run",
          start_time: 1,
          end_time: 2,
          start_place: "start_place",
          end_place: "end_place",
          activity_type: "Operator",
          partial_block_id: "block"
        }
      ]

      trips = [
        %Trip{
          schedule_id: "schedule",
          run_id: "run",
          block_id: "block",
          start_time: 1,
          end_time: 2,
          start_place: "start_place",
          end_place: "end_place",
          route_id: nil,
          trip_id: "trip"
        }
      ]

      expected_piece = %Piece{
        schedule_id: "schedule",
        run_id: "run",
        block_id: "block",
        start: %{
          time: 1,
          place: "start_place",
          mid_route?: false
        },
        trips: ["trip"],
        end: %{
          time: 2,
          place: "end_place",
          mid_route?: false
        }
      }

      assert Load.from_hastus(activities, trips) == %{
               runs: %{
                 {"schedule", "run"} => %Run{
                   schedule_id: "schedule",
                   id: "run",
                   activities: [expected_piece]
                 }
               },
               blocks: %{
                 {"schedule", "block"} => %Block{
                   schedule_id: "schedule",
                   id: "block",
                   pieces: [expected_piece]
                 }
               }
             }
    end

    test "can have multiple pieces in run and block" do
      activities = [
        %Activity{
          schedule_id: "schedule",
          run_id: "run_1",
          start_time: 0,
          end_time: 0,
          start_place: "",
          end_place: "",
          activity_type: "Operator",
          partial_block_id: "block_1"
        },
        %Activity{
          schedule_id: "schedule",
          run_id: "run_1",
          start_time: 0,
          end_time: 0,
          start_place: "",
          end_place: "",
          activity_type: "Operator",
          partial_block_id: "block_2"
        },
        %Activity{
          schedule_id: "schedule",
          run_id: "run_2",
          start_time: 0,
          end_time: 0,
          start_place: "",
          end_place: "",
          activity_type: "Operator",
          partial_block_id: "block_1"
        }
      ]

      trips = [
        %Trip{
          schedule_id: "schedule",
          run_id: "run_1",
          block_id: "block_1",
          start_time: 0,
          end_time: 0,
          start_place: "",
          end_place: "",
          route_id: nil,
          trip_id: "trip_11"
        },
        %Trip{
          schedule_id: "schedule",
          run_id: "run_1",
          block_id: "block_2",
          start_time: 0,
          end_time: 0,
          start_place: "",
          end_place: "",
          route_id: nil,
          trip_id: "trip_12"
        },
        %Trip{
          schedule_id: "schedule",
          run_id: "run_2",
          block_id: "block_1",
          start_time: 0,
          end_time: 0,
          start_place: "",
          end_place: "",
          route_id: nil,
          trip_id: "trip_21"
        }
      ]

      assert %{
               runs: %{
                 {"schedule", "run_1"} => %Run{
                   activities: [
                     %Piece{trips: ["trip_11"]},
                     %Piece{trips: ["trip_12"]}
                   ]
                 },
                 {"schedule", "run_2"} => %Run{
                   activities: [
                     %Piece{trips: ["trip_21"]}
                   ]
                 }
               },
               blocks: %{
                 {"schedule", "block_1"} => %Block{
                   pieces: [
                     %Piece{trips: ["trip_11"]},
                     %Piece{trips: ["trip_21"]}
                   ]
                 },
                 {"schedule", "block_2"} => %Block{
                   pieces: [
                     %Piece{trips: ["trip_12"]}
                   ]
                 }
               }
             } = Load.from_hastus(activities, trips)
    end

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
        %Trip{
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
        %Trip{
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

      assert %{
               runs: %{
                 {"schedule_1", "run"} => %Run{
                   activities: [%Piece{trips: ["trip_1"]}]
                 },
                 {"schedule_2", "run"} => %Run{
                   activities: [%Piece{trips: ["trip_2"]}]
                 }
               },
               blocks: %{
                 {"schedule_1", "block"} => %Block{pieces: [%Piece{trips: ["trip_1"]}]},
                 {"schedule_2", "block"} => %Block{pieces: [%Piece{trips: ["trip_2"]}]}
               }
             } = Load.from_hastus(activities, trips)
    end
  end

  describe "run" do
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
        %Trip{
          schedule_id: "schedule",
          run_id: "run",
          block_id: "block",
          start_time: 101,
          end_time: 102,
          start_place: "place1",
          end_place: "place2",
          route_id: "route",
          trip_id: "trip1"
        },
        %Trip{
          schedule_id: "schedule",
          run_id: "run",
          block_id: "block",
          start_time: 103,
          end_time: 104,
          start_place: "place2",
          end_place: "place3",
          trip_id: "trip2"
        }
      ]

      expected_run = %Run{
        id: "run",
        schedule_id: "schedule",
        activities: [
          %Piece{
            schedule_id: "schedule",
            run_id: "run",
            block_id: "block",
            start: %{
              time: 100,
              place: "place1",
              mid_route?: false
            },
            trips: [
              "trip1",
              "trip2"
            ],
            end: %{
              time: 105,
              place: "place3",
              mid_route?: false
            }
          }
        ]
      }

      assert Load.run(run_key, activities, trips) == expected_run
    end

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
        %Trip{
          schedule_id: "schedule",
          run_id: "run",
          block_id: "block",
          start_time: 101,
          end_time: 102,
          start_place: "",
          end_place: "",
          trip_id: "trip1"
        },
        %Trip{
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

      assert %Run{
               activities: [
                 %Piece{
                   block_id: "block",
                   start: %{time: 101},
                   trips: ["trip1"],
                   end: %{time: 102}
                 } = _,
                 %Piece{
                   block_id: "block",
                   start: %{time: 103},
                   trips: ["trip2"],
                   end: %{time: 104}
                 } = _
               ]
             } = Load.run(run_key, activities, trips)
    end

    test "Deadhead from becomes part of following piece" do
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

      trips = []

      assert %Run{
               activities: [
                 %Piece{
                   start: %{time: 101},
                   trips: [],
                   end: %{time: 103}
                 }
               ]
             } = Load.run(run_key, activities, trips)
    end

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

      trips = []

      assert %Run{
               activities: [
                 %Piece{
                   start: %{time: 101},
                   trips: [],
                   end: %{time: 103}
                 }
               ]
             } = Load.run(run_key, activities, trips)
    end

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
                   start: %{time: 101},
                   end: %{time: 103}
                 }
               ]
             } = Load.run(run_key, activities, trips)
    end

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
                   start: %{time: 15600},
                   trips: [
                     %AsDirected{
                       kind: :wad,
                       start_time: 16200,
                       end_time: 44400
                     }
                   ],
                   end: %{time: 44400}
                 }
               ]
             } = Load.run(run_key, activities, trips)
    end

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
        %Trip{
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
        %Trip{
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
        %Trip{
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
                   start: %{time: 21000},
                   trips: [
                     %AsDirected{
                       kind: :rad,
                       start_time: 21600,
                       end_time: 32400
                     }
                   ],
                   end: %{time: 32400}
                 }
               ]
             } = Load.run(run_key, activities, trips)
    end

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

      assert Load.run(run_key, activities, trips).activities == [expected_break]
    end
  end
end
