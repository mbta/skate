defmodule Gtfs.BlockTest do
  use ExUnit.Case, async: true

  alias Gtfs.Block
  alias Gtfs.Trip
  alias Gtfs.StopTime

  @trip1 %Trip{
    id: "t1",
    route_id: "r",
    service_id: "service",
    headsign: "h",
    direction_id: 0,
    block_id: "b",
    route_pattern_id: "rp",
    shape_id: "shape1",
    stop_times: [
      %StopTime{stop_id: "s1", time: 3, timepoint_id: "tp1"},
      %StopTime{stop_id: "s7", time: 4, timepoint_id: nil}
    ]
  }

  @trip2 %Trip{
    id: "t2",
    route_id: "r",
    service_id: "service",
    headsign: "h",
    direction_id: 1,
    block_id: "b",
    route_pattern_id: "rp",
    shape_id: "shape1",
    stop_times: [
      %StopTime{stop_id: "s7", time: 6, timepoint_id: nil},
      %StopTime{stop_id: "s1", time: 7, timepoint_id: "tp1"}
    ]
  }

  @block [@trip1, @trip2]

  describe "group_trips_by_block/ and get/3 " do
    test "can group trips and then get them" do
      assert [@trip1] ==
               [@trip1]
               |> Block.group_trips_by_block()
               |> Block.get(@trip1.block_id, @trip1.service_id)
    end

    test "sorts trips by time" do
      trips = [
        %{
          @trip1
          | id: "t2",
            stop_times: [
              %StopTime{stop_id: "s", time: 2}
            ]
        },
        %{
          @trip1
          | id: "t1",
            stop_times: [
              %StopTime{stop_id: "s", time: 1}
            ]
        }
      ]

      assert [%Trip{id: "t1"}, %Trip{id: "t2"}] =
               trips
               |> Block.group_trips_by_block()
               |> Block.get("b", "service")
    end

    test "ignores trips without stop times" do
      trips = [
        %{@trip1 | stop_times: []}
      ]

      assert Block.group_trips_by_block(trips) == %{}
    end
  end

  describe "start_time/1" do
    test "returns the time of the first stop of the first trip for this block" do
      assert Block.start_time(@block) == 3
    end
  end

  describe "end_time/1" do
    test "returns the time of the last stop of the last trip for this block" do
      assert Block.end_time(@block) == 7
    end
  end

  describe "first_trip/1" do
    test "returns the first trip of the block" do
      assert Block.first_trip(@block) == @trip1
    end
  end

  describe "last_trip/1" do
    test "returns the last trip of the block" do
      assert Block.last_trip(@block) == @trip2
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
