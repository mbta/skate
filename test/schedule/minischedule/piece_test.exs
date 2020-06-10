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

      stored_piece = %Piece{
        schedule_id: "schedule",
        run_id: "run",
        block_id: "block",
        start_time: "0",
        start_place: "on",
        trips: [trip_id],
        end_time: "1",
        end_place: "off"
      }

      expected_trip = %Minischedule.Trip{
        id: trip_id,
        block_id: "block",
        start_place: "Abcde Heights",
        end_place: "Qwerty Row"
      }

      expected_piece = %{stored_piece | trips: [expected_trip]}

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

      piece = %Piece{
        schedule_id: "schedule",
        run_id: "run",
        block_id: "block",
        start_time: "0",
        start_place: "on",
        trips: [trip, as_directed],
        end_time: "1",
        end_place: "off"
      }

      assert Piece.hydrate(piece, %{}, %{}) == piece
    end
  end
end
