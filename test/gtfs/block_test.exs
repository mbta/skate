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
    stop_times: [
      %StopTime{stop_id: "s1", time: 1, timepoint_id: "tp1"},
      %StopTime{stop_id: "s7", time: 2, timepoint_id: nil}
    ]
  }

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
