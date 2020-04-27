defmodule Schedule.Minischedule.PieceTest do
  use ExUnit.Case, async: true

  alias Schedule.Gtfs.StopTime
  alias Schedule.Trip
  alias Schedule.Minischedule.Piece

  describe "hydrate" do
    test "replaces trip_ids with trips (sans stop_times)" do
      trip_id = "trip"

      stored_trip = %Trip{
        id: trip_id,
        block_id: "block",
        stop_times: [
          %StopTime{
            stop_id: "stop",
            time: 0
          }
        ]
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
        trips: [trip_id],
        end: sign_off
      }

      expected_trip = %Trip{
        id: trip_id,
        block_id: "block",
        stop_times: []
      }

      expected_piece = %Piece{
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
