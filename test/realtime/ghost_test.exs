defmodule Realtime.GhostTest do
  use ExUnit.Case
  import Test.Support.Helpers

  alias Concentrate.StopTimeUpdate
  alias Gtfs.{StopTime, Trip}
  alias Realtime.{BlockWaiver, Ghost}

  setup do
    stop_time_updates = [
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
        stop_id: "stop2",
        stop_sequence: nil,
        track: nil,
        trip_id: "39984755",
        uncertainty: nil
      }
    ]

    reassign_env(:realtime, :stop_time_updates_fn, fn trip_id ->
      if trip_id == "trip" do
        stop_time_updates
      else
        []
      end
    end)
  end

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
               %{~D[2019-01-01] => [block]},
               [],
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
                 route_status: :on_route,
                 block_waivers: %{
                   "trip" => %BlockWaiver{
                     trip_id: "trip",
                     start_time: 1,
                     end_time: 3,
                     remark: "E:1106"
                   }
                 }
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

      vehicles = [%{block_id: "block"}]

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800

      assert Ghost.ghosts(
               %{~D[2019-01-01] => [block]},
               vehicles,
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
               ~D[2019-01-01],
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
               route_status: :pulling_out,
               block_waivers: %{
                 "trip" => %BlockWaiver{
                   trip_id: "trip",
                   start_time: 2,
                   end_time: 2,
                   remark: "E:1106"
                 }
               }
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
               ~D[2019-01-01],
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
               route_status: :laying_over,
               block_waivers: %{}
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
               ~D[2019-01-01],
               time0 + 2
             ) == nil
    end
  end

  describe "current_trip" do
    setup do
      trip1 = %Trip{
        id: "1",
        route_id: "route",
        service_id: "service",
        headsign: "headsign1",
        direction_id: 0,
        block_id: "block",
        route_pattern_id: nil,
        shape_id: "shape",
        run_id: "run",
        stop_times: [
          %StopTime{
            stop_id: "stop1",
            time: 2,
            timepoint_id: "stop1"
          },
          %StopTime{
            stop_id: "stop2",
            time: 4,
            timepoint_id: "stop2"
          }
        ]
      }

      trip2 = %Trip{
        id: "2",
        route_id: "route",
        service_id: "service",
        headsign: "headsign2",
        direction_id: 1,
        block_id: "block",
        route_pattern_id: nil,
        shape_id: "shape",
        run_id: "run",
        stop_times: [
          %StopTime{
            stop_id: "stop2",
            time: 6,
            timepoint_id: "stop2"
          },
          %StopTime{
            stop_id: "stop1",
            time: 8,
            timepoint_id: "stop1"
          }
        ]
      }

      %{
        trip1: trip1,
        trip2: trip2,
        block: [trip1, trip2]
      }
    end

    test "returns pulling out for a block that hasn't started yet", %{block: block, trip1: trip1} do
      assert Ghost.current_trip(block, 1) == {:pulling_out, trip1}
    end

    test "returns on_route if a trip is scheduled to be in progress", %{
      block: block,
      trip1: trip1,
      trip2: trip2
    } do
      assert Ghost.current_trip(block, 3) == {:on_route, trip1}
      assert Ghost.current_trip(block, 7) == {:on_route, trip2}
    end

    test "returns laying_over if the block is scheduled to be between trips", %{
      block: block,
      trip2: trip2
    } do
      assert Ghost.current_trip(block, 5) == {:laying_over, trip2}
    end

    test "returns nil if the block is scheduled to have finished", %{block: block} do
      assert Ghost.current_trip(block, 9) == nil
    end
  end
end
