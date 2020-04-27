defmodule Schedule.Minischedule.RunTest do
  use ExUnit.Case, async: true

  alias Schedule.Trip
  alias Schedule.Minischedule.Break
  alias Schedule.Minischedule.Piece
  alias Schedule.Minischedule.Run

  describe "hydrate" do
    test "hydrates the trips in pieces" do
      trip_id = "trip"

      stored_trip = %Trip{
        id: trip_id,
        block_id: "block"
      }

      sign_on_off = %{
        time: 0,
        place: "place",
        mid_route?: false
      }

      stored_run = %Run{
        schedule_id: "schedule",
        id: "run",
        activities: [
          %Piece{
            schedule_id: "schedule",
            run_id: "run",
            block_id: "block",
            start: sign_on_off,
            trips: [trip_id],
            end: sign_on_off
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
            start: sign_on_off,
            trips: [%Trip{id: trip_id, block_id: "block"}],
            end: sign_on_off
          }
        ]
      }

      assert Run.hydrate(stored_run, %{trip_id => stored_trip}) == expected_run
    end

    test "passes breaks through unchanged" do
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

      assert Run.hydrate(run, %{}) == run
    end
  end
end
