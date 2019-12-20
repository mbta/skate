defmodule Gtfs.BlockTest do
  use ExUnit.Case, async: true

  alias Gtfs.Block
  alias Gtfs.Trip
  alias Gtfs.StopTime

  @trip %Trip{
    id: "t",
    route_id: "r",
    service_id: "service",
    headsign: "h",
    direction_id: 0,
    block_id: "b",
    route_pattern_id: "rp",
    shape_id: "shape1",
    stop_times: [
      %StopTime{stop_id: "s1", time: 1, timepoint_id: "tp1"},
      %StopTime{stop_id: "s7", time: 2, timepoint_id: nil}
    ]
  }

  describe "group_trips_by_block/ and get/3 " do
    test "can group trips and then get them" do
      assert [@trip] ==
               [@trip]
               |> Block.group_trips_by_block()
               |> Block.get(@trip.block_id, @trip.service_id)
    end

    test "sorts trips by time" do
      trips = [
        %{
          @trip
          | id: "t2",
            stop_times: [
              %StopTime{stop_id: "s", time: 2}
            ]
        },
        %{
          @trip
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
        %{@trip | stop_times: []}
      ]

      assert Block.group_trips_by_block(trips) == %{}
    end
  end

  describe "start_time/1" do
    test "returns the time of the first stop of the first trip for this block" do
      assert Block.start_time([@trip]) == 1
    end
  end

  describe "end_time/1" do
    test "returns the time of the last stop of the last trip for this block" do
      assert Block.end_time([@trip]) == 2
    end
  end

  @block [
    %Trip{
      id: "trip1",
      route_id: "route",
      service_id: "today",
      headsign: "headsign1",
      direction_id: 0,
      block_id: "block",
      shape_id: "shape1",
      stop_times: [
        %StopTime{
          stop_id: "stop",
          time: 3
        }
      ]
    },
    %Trip{
      id: "trip2",
      route_id: "route",
      service_id: "today",
      headsign: "headsign2",
      direction_id: 1,
      block_id: "block",
      shape_id: "shape2",
      stop_times: [
        %StopTime{
          stop_id: "stop",
          time: 6
        }
      ]
    }
  ]

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
end
