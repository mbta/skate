defmodule Schedule.Minischedule.BlockTest do
  use ExUnit.Case, async: true

  alias Schedule.Minischedule
  alias Schedule.Minischedule.Piece
  alias Schedule.Minischedule.Block

  describe "hydrate" do
    test "hydrates the trips in pieces" do
      trip_id = "trip"

      stored_trip = %Schedule.Trip{
        id: trip_id,
        block_id: "block"
      }

      sign_on_off = %{
        time: 0,
        place: "place",
        mid_route?: false
      }

      stored_block = %Block{
        schedule_id: "schedule",
        id: "block",
        pieces: [
          %Piece{
            schedule_id: "schedule",
            run_id: "run",
            block_id: "block",
            start: sign_on_off,
            trip_ids: [trip_id],
            end: sign_on_off
          }
        ]
      }

      expected_block = %Block.Hydrated{
        schedule_id: "schedule",
        id: "block",
        pieces: [
          %Piece.Hydrated{
            schedule_id: "schedule",
            run_id: "run",
            block_id: "block",
            start: sign_on_off,
            trips: [%Minischedule.Trip{id: trip_id}],
            end: sign_on_off
          }
        ]
      }

      assert Block.hydrate(stored_block, %{trip_id => stored_trip}) == expected_block
    end
  end
end
