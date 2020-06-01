defmodule Schedule.Minischedule.PieceTest do
  use ExUnit.Case, async: true

  alias Schedule.Gtfs.StopTime
  alias Schedule.Minischedule
  alias Schedule.Minischedule.AsDirected
  alias Schedule.Minischedule.Piece

  describe "hydrate" do
    test "replaces trip_ids with trips" do
      trip_id = "trip"

      stored_trip = %Schedule.Trip{
        id: trip_id,
        block_id: "block",
        stop_times: [
          %StopTime{
            stop_id: "stop",
            time: 0
          }
        ],
        start_place: "abcde",
        end_place: "qwerty"
      }

      timepoint_names_by_id = %{
        "abcde" => "Abcde Heights",
        "qwerty" => "Qwerty Row"
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

      expected_trip = %Minischedule.Trip{
        id: trip_id,
        block_id: "block",
        start_place: "Abcde Heights",
        end_place: "Qwerty Row"
      }

      expected_piece = %Piece{
        schedule_id: "schedule",
        run_id: "run",
        block_id: "block",
        start: sign_on,
        trips: [expected_trip],
        end: sign_off
      }

      assert Piece.hydrate(stored_piece, %{trip_id => stored_trip}, timepoint_names_by_id) ==
               expected_piece
    end

    test "doesn't replace non-ids" do
      trip = %Minischedule.Trip{
        id: "trip",
        block_id: "block",
        start_place: "Ruggles",
        end_place: "Santa Cruz Boardwalk"
      }

      as_directed = %AsDirected{
        kind: :wad,
        start_time: 0,
        end_time: 1,
        start_place: "start",
        end_place: "end"
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

      piece = %Piece{
        schedule_id: "schedule",
        run_id: "run",
        block_id: "block",
        start: sign_on,
        trips: [trip, as_directed],
        end: sign_off
      }

      assert Piece.hydrate(piece, %{}, %{}) == piece
    end
  end
end
