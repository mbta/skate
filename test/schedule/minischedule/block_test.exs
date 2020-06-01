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
        block_id: "block",
        start_place: "mmill",
        end_place: "wherv"
      }

      sign_on_off = %{
        time: 0,
        place: "place",
        mid_route?: false
      }

      timepoint_names_by_id = %{
        "mmill" => "Miller's Mill",
        "wherv" => "Wherever"
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
            trips: [trip_id],
            end: sign_on_off
          }
        ]
      }

      expected_block = %Block{
        schedule_id: "schedule",
        id: "block",
        pieces: [
          %Piece{
            schedule_id: "schedule",
            run_id: "run",
            block_id: "block",
            start: sign_on_off,
            trips: [
              %Minischedule.Trip{
                id: trip_id,
                block_id: "block",
                start_place: "Miller's Mill",
                end_place: "Wherever"
              }
            ],
            end: sign_on_off
          }
        ]
      }

      assert Block.hydrate(stored_block, %{trip_id => stored_trip}, timepoint_names_by_id) ==
               expected_block
    end
  end
end
