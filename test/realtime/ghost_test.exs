defmodule Realtime.GhostTest do
  use ExUnit.Case
  import Test.Support.Helpers
  import Skate.Factory

  alias Schedule.Trip
  alias Schedule.Gtfs.StopTime
  alias Realtime.{BlockWaiver, Ghost}

  @timepoint_names_by_id %{"garage" => "Somerville Garage", "other_garage" => "Other Garage"}

  # 2019-01-01 00:00:00 EST
  @time0 1_546_318_800

  setup do
    reassign_env(:realtime, :block_waivers_for_block_and_service_fn, fn _, _ ->
      [
        %BlockWaiver{
          start_time: 10,
          end_time: 20,
          cause_id: 26,
          cause_description: "E - Diverted",
          remark: "E:1106"
        }
      ]
    end)
  end

  describe "ghosts" do
    test "makes a ghost bus for a block that doesn't have a vehicle" do
      trip =
        build(:trip, %{
          route_pattern_id: "route-X-0",
          stop_times: [
            build(:gtfs_stoptime, %{
              stop_id: "stop1",
              time: 1,
              timepoint_id: "t1"
            }),
            build(:gtfs_stoptime, %{
              stop_id: "stop2",
              time: 3,
              timepoint_id: "t2"
            })
          ],
          start_time: 1,
          end_time: 3
        })

      run =
        build(:run, %{
          activities: [build(:piece, %{trips: [trip], start_time: 1, end_time: 3})]
        })

      expected = [
        %Ghost{
          id: "ghost-trip",
          direction_id: 0,
          route_id: "route",
          trip_id: "trip",
          headsign: "headsign",
          block_id: "block",
          run_id: "run",
          via_variant: "X",
          current_piece_first_route: "route",
          current_piece_start_place: "Somerville Garage",
          layover_departure_time: nil,
          scheduled_logon: 1_546_318_801,
          scheduled_timepoint_status: %{
            timepoint_id: "t2",
            fraction_until_timepoint: 0.5
          },
          route_status: :on_route,
          block_waivers: [
            %BlockWaiver{
              start_time: 10,
              end_time: 20,
              cause_id: 26,
              cause_description: "E - Diverted",
              remark: "E:1106"
            }
          ]
        }
      ]

      assert Ghost.ghosts(
               %{~D[2019-01-01] => [run]},
               [],
               @time0 + 2,
               @timepoint_names_by_id
             ) == expected
    end

    test "does not make a ghost for a run if there's a vehicle on that run" do
      reassign_env(:skate, :trips_by_id_fn, fn _ ->
        %{
          "trip" =>
            build(:trip, %{
              route_pattern_id: "route-X-0",
              stop_times: [
                build(:gtfs_stoptime, %{
                  stop_id: "stop1",
                  time: 1,
                  timepoint_id: "t1"
                }),
                build(:gtfs_stoptime, %{
                  stop_id: "stop2",
                  time: 3,
                  timepoint_id: "t2"
                })
              ],
              start_time: 1,
              end_time: 3
            })
        }
      end)

      run =
        build(:run, %{
          activities: [build(:piece, %{start_time: 1, end_time: 3})]
        })

      vehicles = [%{run_id: "run"}]

      assert Ghost.ghosts(
               %{~D[2019-01-01] => [run]},
               vehicles,
               @time0 + 2,
               @timepoint_names_by_id
             ) == []
    end
  end

  describe "ghost_for_run" do
    test "makes a ghost for a run that should be pulling out" do
      trip1 = build(:trip, %{id: "trip1", route_id: nil, start_time: 1, end_time: 5})

      trip2 =
        build(:trip, %{
          id: "trip2",
          stop_times: [
            build(:gtfs_stoptime, %{
              stop_id: "stop1",
              time: 6,
              timepoint_id: "t1"
            }),
            build(:gtfs_stoptime, %{
              stop_id: "stop2",
              time: 10,
              timepoint_id: "t2"
            })
          ],
          start_time: 6,
          end_time: 10
        })

      run =
        build(:run, %{
          activities: [build(:piece, %{start_time: 1, end_time: 10, trips: [trip1, trip2]})]
        })

      assert %Ghost{
               id: "ghost-trip2",
               direction_id: 0,
               route_id: "route",
               trip_id: "trip2",
               headsign: "headsign",
               block_id: "block",
               run_id: "run",
               via_variant: nil,
               layover_departure_time: 1_546_318_806,
               scheduled_timepoint_status: %{
                 timepoint_id: "t1",
                 fraction_until_timepoint: +0.0
               },
               route_status: :pulling_out,
               block_waivers: [
                 %{
                   remark: "E:1106"
                 }
               ]
             } =
               Ghost.ghost_for_run(
                 run,
                 ~D[2019-01-01],
                 1_546_318_801,
                 @timepoint_names_by_id
               )
    end

    test "makes a ghost for a run that should be laying over" do
      trip1 =
        build(:trip, %{
          id: "trip1",
          headsign: "headsign1",
          direction_id: 0,
          stop_times: [
            build(:gtfs_stoptime, %{
              stop_id: "stop1",
              time: 10,
              timepoint_id: "t1"
            })
          ],
          start_time: 10,
          end_time: 10
        })

      trip2 =
        build(:trip, %{
          id: "trip2",
          headsign: "headsign2",
          direction_id: 1,
          run_id: "run",
          stop_times: [
            build(:gtfs_stoptime, %{
              stop_id: "stop2",
              time: 20,
              timepoint_id: "t2"
            })
          ],
          start_time: 20,
          end_time: 20
        })

      run =
        build(:run, %{
          activities: [build(:piece, %{trips: [trip1, trip2], start_time: 10, end_time: 20})]
        })

      assert Ghost.ghost_for_run(
               run,
               ~D[2019-01-01],
               @time0 + 15,
               @timepoint_names_by_id
             ) == %Ghost{
               id: "ghost-trip2",
               direction_id: 1,
               route_id: "route",
               trip_id: "trip2",
               headsign: "headsign2",
               block_id: "block",
               run_id: "run",
               via_variant: nil,
               current_piece_first_route: "route",
               current_piece_start_place: "Somerville Garage",
               layover_departure_time: @time0 + 20,
               scheduled_logon: 1_546_318_810,
               scheduled_timepoint_status: %{
                 timepoint_id: "t2",
                 fraction_until_timepoint: 0.0
               },
               route_status: :laying_over,
               block_waivers: [
                 %Realtime.BlockWaiver{
                   start_time: 10,
                   end_time: 20,
                   cause_id: 26,
                   cause_description: "E - Diverted",
                   remark: "E:1106"
                 }
               ]
             }
    end

    test "no ghost for a trip without timepoints" do
      trip =
        build(:trip, %{
          stop_times: [
            build(:gtfs_stoptime, %{
              stop_id: "stop1",
              time: 1,
              timepoint_id: nil
            }),
            build(:gtfs_stoptime, %{
              stop_id: "stop2",
              time: 3,
              timepoint_id: nil
            })
          ],
          start_time: 1,
          end_time: 3
        })

      run =
        build(:run, %{
          activities: [build(:piece, %{trips: [trip], start_time: 1, end_time: 3})]
        })

      assert Ghost.ghost_for_run(
               run,
               ~D[2019-01-01],
               @time0 + 2,
               @timepoint_names_by_id
             ) == nil
    end

    test "no ghost for an as-directed" do
      as_directed =
        build(:as_directed, %{
          start_time: 1,
          end_time: 3
        })

      run =
        build(:run, %{
          activities: [build(:piece, %{trips: [as_directed], start_time: 1, end_time: 3})]
        })

      assert Ghost.ghost_for_run(
               run,
               ~D[2019-01-01],
               @time0 + 2,
               @timepoint_names_by_id
             ) == nil
    end

    test "includes scheduled logon time, first route, and start place if available" do
      reassign_env(:skate, :trips_by_id_fn, fn _ ->
        %{"trip" => build(:trip, %{id: "trip"})}
      end)

      run = build(:run)

      assert %Ghost{
               id: "ghost-trip",
               direction_id: 0,
               route_id: "route",
               trip_id: "trip",
               headsign: "headsign",
               block_id: "block",
               run_id: "run",
               via_variant: nil,
               layover_departure_time: 1_546_318_900,
               scheduled_timepoint_status: %{
                 timepoint_id: "t1",
                 fraction_until_timepoint: +0.0
               },
               scheduled_logon: 1_546_318_850,
               route_status: :pulling_out,
               current_piece_start_place: "Somerville Garage",
               current_piece_first_route: "route"
             } =
               Ghost.ghost_for_run(
                 run,
                 ~D[2019-01-01],
                 1_546_318_860,
                 @timepoint_names_by_id
               )
    end

    test "handles mid-route swing on for current piece logon and first route purposes" do
      trip1 = build(:trip, %{id: "trip", start_time: 40, end_time: 100})
      trip2 = build(:trip, %{id: "trip2", route_id: "route2", start_time: 20, end_time: 40})

      run =
        build(:run, %{
          activities: [
            build(:piece, %{
              start_place: "station",
              start_mid_route?: %{
                time: 40,
                trip: trip2
              },
              trips: [
                trip1
              ],
              end_place: "garage"
            })
          ]
        })

      assert %Ghost{
               id: "ghost-trip",
               direction_id: 0,
               route_id: "route",
               trip_id: "trip",
               headsign: "headsign",
               block_id: "block",
               run_id: "run",
               via_variant: nil,
               layover_departure_time: nil,
               scheduled_timepoint_status: %{
                 timepoint_id: "t1",
                 fraction_until_timepoint: +0.0
               },
               scheduled_logon: 1_546_318_850,
               route_status: :on_route,
               current_piece_start_place: "station",
               current_piece_first_route: "route2"
             } =
               Ghost.ghost_for_run(
                 run,
                 ~D[2019-01-01],
                 1_546_318_860,
                 @timepoint_names_by_id
               )
    end
  end

  describe "current_trip" do
    setup do
      trip1 = %Trip{
        id: "1",
        block_id: "block",
        route_id: "route",
        service_id: "service",
        headsign: "headsign1",
        direction_id: 0,
        route_pattern_id: nil,
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
        ],
        start_time: 2,
        end_time: 4
      }

      trip2 = %Trip{
        id: "2",
        block_id: "block",
        route_id: "route",
        service_id: "service",
        headsign: "headsign2",
        direction_id: 1,
        route_pattern_id: nil,
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
        ],
        start_time: 6,
        end_time: 8
      }

      %{
        trip1: trip1,
        trip2: trip2,
        trips: [trip1, trip2]
      }
    end

    test "returns pulling out for a block that hasn't started yet", %{trips: trips, trip1: trip1} do
      assert Ghost.current_trip(trips, 1) == {:pulling_out, trip1}
    end

    test "returns on_route if a trip is scheduled to be in progress", %{
      trips: trips,
      trip1: trip1,
      trip2: trip2
    } do
      assert Ghost.current_trip(trips, 3) == {:on_route, trip1}
      assert Ghost.current_trip(trips, 7) == {:on_route, trip2}
    end

    test "returns laying_over if the block is scheduled to be between trips", %{
      trips: trips,
      trip2: trip2
    } do
      assert Ghost.current_trip(trips, 5) == {:laying_over, trip2}
    end

    test "returns nil if the block is scheduled to have finished", %{trips: trips} do
      assert Ghost.current_trip(trips, 9) == nil
    end
  end
end
