defmodule Realtime.BlockWaiverTest do
  use ExUnit.Case

  alias Concentrate.StopTimeUpdate
  alias Gtfs.{StopTime, Trip}
  alias Realtime.BlockWaiver

  @trip %Trip{
    id: "trip1",
    route_id: "route",
    service_id: "service",
    headsign: "headsign",
    direction_id: 0,
    block_id: "block",
    shape_id: "shape",
    stop_times: [
      %StopTime{
        stop_id: "stop1",
        time: 3
      },
      %StopTime{
        stop_id: "stop2",
        time: 6
      },
      %StopTime{
        stop_id: "stop3",
        time: 9
      }
    ]
  }

  @stop_time_updates [
    %StopTimeUpdate{
      arrival_time: nil,
      departure_time: nil,
      platform_id: nil,
      remark: "E:1106",
      schedule_relationship: :SKIPPED,
      status: nil,
      stop_id: "stop1",
      stop_sequence: nil,
      track: nil,
      trip_id: "trip1",
      uncertainty: nil
    },
    %StopTimeUpdate{
      arrival_time: nil,
      departure_time: nil,
      platform_id: nil,
      remark: "E:1106",
      schedule_relationship: :SKIPPED,
      status: nil,
      stop_id: "stop2",
      stop_sequence: nil,
      track: nil,
      trip_id: "trip1",
      uncertainty: nil
    }
  ]

  describe "from_trip_stop_time_updates/2" do
    test "builds a BlockWaiver from a set of StopTimeUpdate records for a Trip" do
      expected = %BlockWaiver{
        trip_id: "trip1",
        start_time: 3,
        end_time: 6,
        remark: "E:1106"
      }

      assert BlockWaiver.from_trip_stop_time_updates(@trip, @stop_time_updates) == expected
    end

    test "returns nil if there are no stop time updates" do
      assert BlockWaiver.from_trip_stop_time_updates(@trip, []) == nil
    end
  end
end
