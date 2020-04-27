defmodule Schedule.Minischedule.LoadTest do
  use ExUnit.Case, async: true

  alias Schedule.Hastus.Activity
  alias Schedule.Hastus.Trip
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

      # TODO remove this once the placeholder piece implementation handles Operator activities correctly.
      placeholder_break = %Break{
        break_type: "Operator",
        start_time: 1,
        end_time: 2,
        start_place: "start_place",
        end_place: "end_place"
      }

      assert Load.from_hastus(activities, trips) == %{
               runs: %{
                 {"schedule", "run"} => %Run{
                   schedule_id: "schedule",
                   id: "run",
                   activities: [placeholder_break, expected_piece]
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
                 # TODO remove breaks from runs. They're from the placeholder piece implementation.
                 {"schedule", "run_1"} => %Run{
                   activities: [
                     _break_11,
                     _break_12,
                     %Piece{trips: ["trip_11"]},
                     %Piece{trips: ["trip_12"]}
                   ]
                 },
                 {"schedule", "run_2"} => %Run{
                   activities: [
                     _break_21,
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
                 # TODO remove breaks from runs. They're from the placeholder piece implementation.
                 {"schedule_1", "run"} => %Run{
                   activities: [_break_1, %Piece{trips: ["trip_1"]}]
                 },
                 {"schedule_2", "run"} => %Run{
                   activities: [_break_2, %Piece{trips: ["trip_2"]}]
                 }
               },
               blocks: %{
                 {"schedule_1", "block"} => %Block{pieces: [%Piece{trips: ["trip_1"]}]},
                 {"schedule_2", "block"} => %Block{pieces: [%Piece{trips: ["trip_2"]}]}
               }
             } = Load.from_hastus(activities, trips)
    end
  end

  # TODO when there's a real implementation for making pieces
  describe "run" do
    test "multiple trips are grouped into the same piece" do
    end

    test "trips become multiple pieces if there are multiple Operator activities" do
    end

    test "piece start time is based on sign_on activity" do
    end

    test "makes breaks" do
    end

    test "matches break_id in trips with partial_break_id in activities" do
    end
  end
end
