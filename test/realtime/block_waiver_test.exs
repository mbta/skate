defmodule Realtime.BlockWaiverTest do
  use ExUnit.Case
  import Test.Support.Helpers

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

  describe "block_waivers_for_block/1" do
    setup do
      trip1 = %Trip{
        id: "t1",
        route_id: "28",
        service_id: "service",
        headsign: "headsign",
        direction_id: 1,
        block_id: "b1",
        route_pattern_id: "28-_-0",
        shape_id: "shape1",
        run_id: "run1",
        stop_times: [
          %StopTime{stop_id: "18511", time: 0, timepoint_id: "tp1"},
          %StopTime{stop_id: "18512", time: 1, timepoint_id: nil},
          %StopTime{stop_id: "18513", time: 2, timepoint_id: "tp2"}
        ]
      }

      trip2 = %Trip{
        id: "t2",
        route_id: "28",
        service_id: "service",
        headsign: "headsign",
        direction_id: 0,
        block_id: "S28-2",
        route_pattern_id: "28-_-0",
        shape_id: "shape1",
        run_id: "run1",
        stop_times: [
          %StopTime{stop_id: "18513", time: 3, timepoint_id: "tp2"},
          %StopTime{stop_id: "18512", time: 4, timepoint_id: nil},
          %StopTime{stop_id: "18511", time: 5, timepoint_id: "tp1"}
        ]
      }

      block = [trip1, trip2]

      stop_time_updates = [
        %StopTimeUpdate{
          arrival_time: nil,
          departure_time: nil,
          platform_id: nil,
          remark: "E:1106",
          schedule_relationship: :SKIPPED,
          status: nil,
          stop_id: "18511",
          stop_sequence: nil,
          track: nil,
          trip_id: "39984755",
          uncertainty: nil
        },
        %StopTimeUpdate{
          arrival_time: nil,
          departure_time: nil,
          platform_id: nil,
          remark: "E:1106",
          schedule_relationship: :SKIPPED,
          status: nil,
          stop_id: "18512",
          stop_sequence: nil,
          track: nil,
          trip_id: "39984755",
          uncertainty: nil
        }
      ]

      reassign_env(:realtime, :stop_time_updates_fn, fn trip_id ->
        if trip_id == trip1.id do
          stop_time_updates
        else
          []
        end
      end)

      {:ok, %{block: block}}
    end

    test "returns block waivers for any trip that has skipped stops", %{block: block} do
      expected = %{
        "t1" => %BlockWaiver{
          trip_id: "t1",
          start_time: 0,
          end_time: 1,
          remark: "E:1106"
        }
      }

      assert BlockWaiver.block_waivers_for_block(block) == expected
    end

    test "returns nil if no trips have skipped stops" do
      assert BlockWaiver.block_waivers_for_block([]) == nil
    end

    test "returns nil if the block was nil" do
      assert BlockWaiver.block_waivers_for_block(nil) == nil
    end
  end
end
