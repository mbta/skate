defmodule Schedule.Minischedule.PieceTest do
  use ExUnit.Case, async: true

  alias Schedule.Minischedule
  alias Schedule.Minischedule.Piece

  describe "hydrate" do
    test "hydrates trips" do
      trip_id = "trip"

      stored_trip = %Schedule.Trip{
        id: trip_id,
        block_id: "block"
      }

      sign_on = %{
        time: "0",
        place: "on",
        mid_route?: false
      }

      sign_off = %{
        time: "1",
        place: "off",
        mid_route?: false
      }

      stored_piece = %Piece{
        schedule_id: "schedule",
        run_id: "run",
        block_id: "block",
        start: sign_on,
        trip_ids: [trip_id],
        end: sign_off
      }

      expected_trip = %Minischedule.Trip{
        id: trip_id
      }

      expected_piece = %Piece.Hydrated{
        schedule_id: "schedule",
        run_id: "run",
        block_id: "block",
        start: sign_on,
        trips: [expected_trip],
        end: sign_off
      }

      assert Piece.hydrate(stored_piece, %{trip_id => stored_trip}) == expected_piece
    end
  end
end
