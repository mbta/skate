defmodule Schedule.Minischedule.RunTest do
  use ExUnit.Case, async: true
  import Skate.Factory

  alias Schedule.Minischedule
  alias Schedule.Minischedule.Break
  alias Schedule.Minischedule.Piece
  alias Schedule.Minischedule.Run

  describe "hydrate" do
    test "hydrates the trips in pieces" do
      trip_id = "trip"

      stored_trip = %Schedule.Trip{
        id: trip_id,
        block_id: "block",
        start_place: "start",
        end_place: "end"
      }

      stored_run = %Run{
        schedule_id: "schedule",
        id: "run",
        activities: [
          %Piece{
            schedule_id: "schedule",
            run_id: "run",
            block_id: "block",
            start_time: 0,
            start_place: "place",
            trips: [trip_id],
            end_time: 0,
            end_place: "place"
          }
        ]
      }

      expected_run = %Run{
        schedule_id: "schedule",
        id: "run",
        activities: [
          %Piece{
            schedule_id: "schedule",
            run_id: "run",
            block_id: "block",
            start_time: 0,
            start_place: "place",
            trips: [
              %Minischedule.Trip{
                id: trip_id,
                block_id: "block",
                start_place: "Start place",
                end_place: "End place"
              }
            ],
            end_time: 0,
            end_place: "place"
          }
        ]
      }

      assert Run.hydrate(stored_run, %{trip_id => stored_trip}, %{
               "start" => "Start place",
               "end" => "End place"
             }) == expected_run
    end

    test "passes breaks through unchanged apart from making names human-readable" do
      break = %Break{
        break_type: "break",
        start_time: 0,
        end_time: 1,
        start_place: "start",
        end_place: "end"
      }

      run = %Run{
        schedule_id: "schedule",
        id: "run",
        activities: [break]
      }

      expected_result = %Run{
        run
        | activities: [
            %{break | start_place: "Startpoint", end_place: "End Of The Line"}
          ]
      }

      assert Run.hydrate(run, %{}, %{"start" => "Startpoint", "end" => "End Of The Line"}) ==
               expected_result
    end
  end

  describe "is_active?/3" do
    test "returns true when a piece overlaps with the range given" do
      run =
        build(:minischedule_run, %{
          activities: [
            build(:minischedule_piece, %{start_time: 0, end_time: 100}),
            build(:minischedule_piece, %{start_time: 200, end_time: 300})
          ]
        })

      assert Run.is_active?(run, 75, 125)
    end

    test "returns false when a piece does not overlap with the range given" do
      run =
        build(:minischedule_run, %{
          activities: [
            build(:minischedule_piece, %{start_time: 0, end_time: 100}),
            build(:minischedule_piece, %{start_time: 200, end_time: 300})
          ]
        })

      refute Run.is_active?(run, 125, 175)
    end
  end
end
