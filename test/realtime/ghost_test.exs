defmodule Realtime.GhostTest do
  use ExUnit.Case

  alias Gtfs.StopTime
  alias Gtfs.Trip
  alias Realtime.Ghost

  describe "ghosts" do
    test "makes a ghost bus for a block that doesn't have a vehicle" do
      trip = %Trip{
        id: "trip",
        route_id: "route",
        service_id: "service",
        headsign: "headsign",
        direction_id: 0,
        block_id: "block",
        route_pattern_id: "route-X-0",
        shape_id: "shape1",
        run_id: "run",
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

      block = [trip]

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800

      assert Ghost.ghosts(
               [block],
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
                 run_id: "run",
                 via_variant: "X",
                 layover_departure_time: nil,
                 scheduled_timepoint_status: %{
                   timepoint_id: "t2",
                   fraction_until_timepoint: 0.5
                 },
                 route_status: :on_route
               }
             ]
    end

    test "does not make a ghost for a block if there's a vehicle on that block" do
      trip = %Trip{
        id: "trip1",
        route_id: "route",
        service_id: "service",
        headsign: "headsign",
        direction_id: 0,
        block_id: "block",
        shape_id: "shape1",
        run_id: "run",
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

      block = [trip]

      vehicles_by_block = %{"block" => :vehicle}

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800

      assert Ghost.ghosts(
               [block],
               vehicles_by_block,
               time0 + 2
             ) == []
    end
  end

  describe "ghost_for_block" do
    test "makes a ghost for a block that should be pulling out" do
      trip = %Trip{
        id: "trip",
        route_id: "route",
        service_id: "service",
        headsign: "headsign",
        direction_id: 0,
        block_id: "block",
        shape_id: "shape1",
        run_id: "run",
        stop_times: [
          %StopTime{
            stop_id: "stop1",
            time: 2,
            timepoint_id: "t1"
          }
        ]
      }

      block = [trip]
      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800

      assert Ghost.ghost_for_block(
               block,
               time0 + 1
             ) == %Ghost{
               id: "ghost-trip",
               direction_id: 0,
               route_id: "route",
               trip_id: "trip",
               headsign: "headsign",
               block_id: "block",
               run_id: "run",
               via_variant: nil,
               layover_departure_time: time0 + 2,
               scheduled_timepoint_status: %{
                 timepoint_id: "t1",
                 fraction_until_timepoint: 0.0
               },
               route_status: :pulling_out
             }
    end

    test "makes a ghost for a block that should be laying over" do
      block = [
        %Trip{
          id: "trip1",
          route_id: "route",
          service_id: "service",
          headsign: "headsign1",
          direction_id: 0,
          block_id: "block",
          shape_id: "shape1",
          run_id: "run",
          stop_times: [
            %StopTime{
              stop_id: "stop1",
              time: 10,
              timepoint_id: "t1"
            }
          ]
        },
        %Trip{
          id: "trip2",
          route_id: "route",
          service_id: "service",
          headsign: "headsign2",
          direction_id: 1,
          block_id: "block",
          shape_id: "shape2",
          run_id: "run",
          stop_times: [
            %StopTime{
              stop_id: "stop2",
              time: 20,
              timepoint_id: "t2"
            }
          ]
        }
      ]

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800

      assert Ghost.ghost_for_block(
               block,
               time0 + 15
             ) == %Ghost{
               id: "ghost-trip2",
               direction_id: 1,
               route_id: "route",
               trip_id: "trip2",
               headsign: "headsign2",
               block_id: "block",
               run_id: "run",
               via_variant: nil,
               layover_departure_time: time0 + 20,
               scheduled_timepoint_status: %{
                 timepoint_id: "t2",
                 fraction_until_timepoint: 0.0
               },
               route_status: :laying_over
             }
    end

    test "no ghost for a trip without timepoints" do
      trip = %Trip{
        id: "trip1",
        route_id: "route",
        service_id: "service",
        headsign: "headsign",
        direction_id: 0,
        block_id: "block",
        shape_id: "shape1",
        run_id: "run",
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

      block = [trip]

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800

      assert Ghost.ghost_for_block(
               block,
               time0 + 2
             ) == nil
    end
  end
end
