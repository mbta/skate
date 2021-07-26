defmodule Schedule.Minischedule.BlockTest do
  use ExUnit.Case, async: true

  alias Schedule.Minischedule.Piece
  alias Schedule.Minischedule.Block
  alias Schedule.Trip

  import Skate.Factory

  describe "hydrate" do
    test "hydrates the trips in pieces" do
      trip_id = "trip"

      stored_trip =
        build(:trip,
          id: trip_id,
          start_place: "mmill",
          end_place: "wherv"
        )

      timepoint_names_by_id = %{
        "mmill" => "Miller's Mill",
        "wherv" => "Wherever"
      }

      stored_piece =
        build(:minischedule_piece,
          schedule_id: "schedule",
          run_id: "run",
          block_id: "block",
          start_time: 0,
          start_place: "place",
          trips: [trip_id],
          end_time: 0,
          end_place: "place"
        )

      stored_block =
        build(:minischedule_block,
          pieces: [
            stored_piece
          ]
        )

      expected_block = %Block{
        schedule_id: "schedule",
        id: "block",
        pieces: [
          %Piece{
            schedule_id: "schedule",
            run_id: "run",
            block_id: "block",
            start_time: 0,
            start_place: "place",
            trips: [
              %Trip{
                stored_trip
                | pretty_start_place: "Miller's Mill",
                  pretty_end_place: "Wherever"
              }
            ],
            end_time: 0,
            end_place: "place"
          }
        ]
      }

      assert Block.hydrate(stored_block, %{trip_id => stored_trip}, timepoint_names_by_id) ==
               expected_block
    end
  end
end
