defmodule Schedule.BlockTest do
  use ExUnit.Case, async: true

  alias Schedule.Block
  alias Schedule.{Block, Trip}
  alias Schedule.Gtfs.StopTime

  @trip1 %Trip{
    id: "t1",
    block_id: "b",
    service_id: "service",
    schedule_id: "schedule",
    stop_times: [
      %StopTime{stop_id: "s1", time: 3, timepoint_id: "tp1"},
      %StopTime{stop_id: "s7", time: 4, timepoint_id: nil}
    ],
    start_time: 3,
    end_time: 4
  }

  @trip2 %Trip{
    id: "t2",
    block_id: "b",
    service_id: "service",
    schedule_id: "schedule",
    stop_times: [
      %StopTime{stop_id: "s7", time: 6, timepoint_id: nil},
      %StopTime{stop_id: "s1", time: 7, timepoint_id: "tp1"}
    ],
    start_time: 6,
    end_time: 7
  }

  @block %Block{
    id: "b",
    service_id: "service",
    schedule_id: "schedule",
    start_time: 3,
    end_time: 7,
    trips: [@trip1, @trip2]
  }

  describe "blocks_from_trips/ and get/3 " do
    test "can create blocks and then get them" do
      by_id = Block.blocks_from_trips([@trip1])

      assert Block.get(by_id, @trip1.block_id, @trip1.service_id) == %Block{
               id: @trip1.block_id,
               service_id: @trip1.service_id,
               schedule_id: @trip1.schedule_id,
               start_time: 3,
               end_time: 4,
               trips: [@trip1]
             }
    end

    test "sorts trips by time" do
      trips = [
        %{
          @trip1
          | id: "t2",
            stop_times: [
              %StopTime{stop_id: "s", time: 2}
            ],
            start_time: 2,
            end_time: 2
        },
        %{
          @trip1
          | id: "t1",
            stop_times: [
              %StopTime{stop_id: "s", time: 1}
            ],
            start_time: 1,
            end_time: 1
        }
      ]

      assert %Block{trips: [%Trip{id: "t1"}, %Trip{id: "t2"}]} =
               trips
               |> Block.blocks_from_trips()
               |> Block.get("b", "service")
    end

    test "ignores trips without stop times" do
      trips = [
        %{@trip1 | stop_times: []}
      ]

      assert Block.blocks_from_trips(trips) == %{}
    end
  end

  describe "next_trip/2" do
    test "finds the trip in the block after the given trip" do
      assert Block.next_trip(@block, @trip1.id) == {:trip, @trip2}
    end

    test "returns :last if given the last trip in the block" do
      assert Block.next_trip(@block, @trip2.id) == :last
    end

    test "returns :err if the given trip isn't found" do
      assert Block.next_trip(@block, "t3") == :err
    end
  end

  describe "is_active" do
    test "a block that starts before the range and ends after is active" do
      assert Block.is_active(@block, 4, 5)
    end

    test "a block that starts before the range and ends during is active" do
      assert Block.is_active(@block, 5, 7)
    end

    test "a block that starts during the range and ends after is active" do
      assert Block.is_active(@block, 2, 4)
    end

    test "a block that's laying over is active" do
      assert Block.is_active(@block, 2, 7)
    end

    test "a block is active if the start and end times are the same" do
      assert Block.is_active(@block, 4, 4)
    end

    test "a block totally before the range is inactive" do
      refute Block.is_active(@block, 7, 8)
    end

    test "a block totally after the range is inactive" do
      refute Block.is_active(@block, 1, 2)
    end
  end

  describe "trip_at_time/2" do
    test "returns a trip if it is active" do
      assert %Trip{id: "t1"} = Block.trip_at_time(@block, 3)
      assert %Trip{id: "t2"} = Block.trip_at_time(@block, 6)
    end

    test "returns the next trip if the previous one has ended" do
      assert %Trip{id: "t2"} = Block.trip_at_time(@block, 5)
    end

    test "returns the first trip if the block hasn't started yet" do
      assert %Trip{id: "t1"} = Block.trip_at_time(@block, 2)
    end

    test "returns the last trip if the block has finished" do
      assert %Trip{id: "t2"} = Block.trip_at_time(@block, 8)
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
