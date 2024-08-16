defmodule Schedule.BlockTest do
  use ExUnit.Case, async: true

  import Skate.Factory

  alias Schedule.Block
  alias Schedule.{Block, Trip}
  alias Schedule.Gtfs.StopTime

  @pullout %Trip{
    id: "pullout",
    block_id: "b",
    schedule_id: "schedule",
    route_id: nil,
    start_time: 1,
    end_time: 3,
    start_place: "garage"
  }

  @trip1 %Trip{
    id: "t1",
    block_id: "b",
    service_id: "service",
    schedule_id: "schedule",
    route_id: "route",
    stop_times: [
      %StopTime{stop_id: "s1", time: 3, timepoint_id: "tp1"},
      %StopTime{stop_id: "s7", time: 4, timepoint_id: nil}
    ],
    start_time: 5,
    end_time: 7
  }

  @deadhead %Trip{
    id: "deadhead",
    block_id: "b",
    schedule_id: "schedule",
    route_id: nil,
    start_time: 9,
    end_time: 11
  }

  @trip2 %Trip{
    id: "t2",
    block_id: "b",
    service_id: "service",
    schedule_id: "schedule",
    route_id: "route",
    stop_times: [
      %StopTime{stop_id: "s7", time: 6, timepoint_id: nil},
      %StopTime{stop_id: "s1", time: 7, timepoint_id: "tp1"}
    ],
    start_time: 13,
    end_time: 15
  }

  @pullback %Trip{
    id: "deadhead",
    block_id: "b",
    schedule_id: "schedule",
    route_id: nil,
    start_time: 17,
    end_time: 19,
    end_place: "garage"
  }

  @piece build(:piece,
           block_id: @pullout.block_id,
           start_time: 1,
           end_time: 19,
           trips: [@pullout, @trip1, @deadhead, @trip2, @pullback]
         )

  @block build(
           :block,
           id: "b",
           schedule_id: "schedule",
           start_time: 1,
           end_time: 19,
           pieces: [@piece]
         )

  describe "blocks_from_trips/ and get/3 " do
    test "can create blocks and then get them" do
      by_id = Block.blocks_from_pieces([@piece])

      assert Block.get(by_id, "schedule", "b") == %{
               @block
               | start_time: @piece.start_time,
                 end_time: @piece.end_time,
                 pieces: [@piece]
             }
    end

    test "sets start_time and end_time based on pulls" do
      earlier_piece =
        build(:piece,
          start_time: 100,
          end_time: 130,
          schedule_id: @block.schedule_id,
          block_id: @block.id
        )

      later_piece =
        build(:piece,
          start_time: 140,
          end_time: 200,
          schedule_id: @block.schedule_id,
          block_id: @block.id
        )

      expected_block = %Block{
        @block
        | start_time: 100,
          end_time: 200,
          pieces: [earlier_piece, later_piece]
      }

      by_id = Block.blocks_from_pieces([later_piece, earlier_piece])
      assert Block.get(by_id, "schedule", "b") == expected_block
    end
  end

  describe "next_revenue_trip/2" do
    test "finds the trip in the block after the given trip" do
      assert Block.next_revenue_trip(@block, @trip1.id) == {:trip, @trip2}
    end

    test "returns :last if given the last trip in the block" do
      assert Block.next_revenue_trip(@block, @trip2.id) == :last
    end

    test "returns :err if the given trip isn't found" do
      assert Block.next_revenue_trip(@block, "t3") == :err
    end
  end

  describe "active?" do
    test "a block that starts before the range and ends after is active" do
      assert Block.active?(@block, 2, 18)
    end

    test "a block that starts before the range and ends during is active" do
      assert Block.active?(@block, 2, 20)
    end

    test "a block that starts during the range and ends after is active" do
      assert Block.active?(@block, 0, 18)
    end

    test "a block that's laying over is active" do
      assert Block.active?(@block, 8, 12)
    end

    test "a block is active if the start and end times are the same" do
      assert Block.active?(@block, 6, 6)
    end

    test "a block totally before the range is inactive" do
      refute Block.active?(@block, 20, 21)
    end

    test "a block totally after the range is inactive" do
      refute Block.active?(@block, 0, 0)
    end
  end

  describe "trip_at_time/2" do
    test "returns a trip if it is active" do
      assert %Trip{id: "t1"} = Block.trip_at_time(@block, 6)
      assert %Trip{id: "t2"} = Block.trip_at_time(@block, 14)
    end

    test "returns the next trip if the previous one has ended" do
      assert %Trip{id: "t2"} = Block.trip_at_time(@block, 8)
    end

    test "returns the first trip if the block hasn't started yet" do
      assert %Trip{id: "t1"} = Block.trip_at_time(@block, 0)
    end

    test "returns the first trip if pulling out" do
      assert %Trip{id: "t1"} = Block.trip_at_time(@block, 2)
    end

    test "returns the last trip if pulling back" do
      assert %Trip{id: "t2"} = Block.trip_at_time(@block, 18)
    end
  end

  describe "pull_back_place_id/1" do
    test "handles nil" do
      assert nil |> Block.pull_back_place_id() |> is_nil()
    end

    test "returns end place of last trip" do
      assert Block.pull_back_place_id(@block) == "garage"
    end

    test "handles empty pieces list" do
      assert %{@block | pieces: []} |> Block.pull_back_place_id() |> is_nil()
    end

    test "handles piece without trips" do
      assert %{@block | pieces: [%{@piece | trips: []}]} |> Block.pull_back_place_id() |> is_nil()
    end
  end

  describe "overload?" do
    test "returns true if there is a `-OL<number> appendend to the block_id" do
      assert Block.overload?("C01-14-OL1")
    end

    test "returns false if there is nothing appended to the block_id" do
      refute Block.overload?("C01-14")
    end
  end

  describe "id_sans_overload/1" do
    test "removes the overload portion of the ID" do
      assert Block.id_sans_overload("T80-140-OL1") == "T80-140"
    end

    test "does not change an ID without an overload" do
      assert Block.id_sans_overload("T80-140") == "T80-140"
    end

    test "returns nil when given nil" do
      assert Block.id_sans_overload(nil) == nil
    end
  end
end
