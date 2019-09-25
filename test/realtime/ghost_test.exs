defmodule Realtime.GhostTest do
  use ExUnit.Case

  alias Gtfs.StopTime
  alias Gtfs.Trip
  alias Realtime.Ghost

  describe "ghosts" do
    test "makes a ghost bus for a trip that doesn't have a vehicle" do
      trip = %Trip{
        id: "trip",
        route_id: "route",
        service_id: "service",
        headsign: "headsign",
        direction_id: 0,
        block_id: "block",
        route_pattern_id: "route-X-0",
        shape_id: "shape1",
        stop_times: [
          %StopTime{
            stop_id: "stop1",
            time: 1,
            timepoint_id: "t1"
          },
          %StopTime{
            stop_id: "stop2",
            time: 3,
            timepoint_id: "t2"
          }
        ]
      }

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800

      assert Ghost.ghosts(
               [trip],
               %{},
               time0 + 2
             ) == [
               %Ghost{
                 id: "ghost-trip",
                 direction_id: 0,
                 route_id: "route",
                 trip_id: "trip",
                 headsign: "headsign",
                 block_id: "block",
                 via_variant: "X",
                 scheduled_timepoint_status: %{
                   timepoint_id: "t2",
                   fraction_until_timepoint: 0.5
                 }
               }
             ]
    end

    test "does not make a ghost for a trip if there's a vehicle on that block" do
      trip = %Trip{
        id: "trip1",
        route_id: "route",
        service_id: "service",
        headsign: "headsign",
        direction_id: 0,
        block_id: "block",
        shape_id: "shape1",
        stop_times: [
          %StopTime{
            stop_id: "stop1",
            time: 1,
            timepoint_id: "t1"
          },
          %StopTime{
            stop_id: "stop2",
            time: 3,
            timepoint_id: "t2"
          }
        ]
      }

      vehicles_by_block = %{"block" => :vehicle}

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800

      assert Ghost.ghosts(
               [trip],
               vehicles_by_block,
               time0 + 2
             ) == []
    end

    test "no ghosts for trips without timepoints" do
      trip = %Trip{
        id: "trip1",
        route_id: "route",
        service_id: "service",
        headsign: "headsign",
        direction_id: 0,
        block_id: "block",
        shape_id: "shape1",
        stop_times: [
          %StopTime{
            stop_id: "stop1",
            time: 1,
            timepoint_id: nil
          },
          %StopTime{
            stop_id: "stop2",
            time: 3,
            timepoint_id: nil
          }
        ]
      }

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800

      assert Ghost.ghosts(
               [trip],
               %{},
               time0 + 2
             ) == []
    end
  end
end
