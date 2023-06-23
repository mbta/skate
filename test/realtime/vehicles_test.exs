defmodule Realtime.VehiclesTest do
  use ExUnit.Case
  import Test.Support.Helpers
  import Skate.Factory

  alias Schedule.Trip
  alias Schedule.Gtfs.StopTime
  alias Realtime.{BlockWaiver, Ghost, Vehicle, Vehicles}

  @timepoint_names_by_id %{"garage" => "Somerville Garage", "other_garage" => "Other Garage"}

  describe "group_by_route" do
    test "when an interlining vehicle starts a trip on a new route before the previous trip was scheduled to finished, they are not included on that old route" do
      date_of_trips = ~D[2019-01-01]
      start_time_trip_1 = 0

      trip_1 = %Trip{
        id: "trip",
        block_id: "block1",
        route_id: "first_route",
        service_id: "service",
        headsign: "headsign2",
        direction_id: 0,
        stop_times: [
          %StopTime{
            stop_id: "stop1",
            time: 10,
            timepoint_id: "t1"
          }
        ],
        start_time: start_time_trip_1,
        end_time: start_time_trip_1 + 10
      }

      trip_2 = %Trip{
        id: "trip2",
        block_id: trip_1.block_id,
        route_id: "second_route",
        service_id: "service",
        headsign: "headsign2",
        direction_id: 0,
        stop_times: [
          %StopTime{
            stop_id: "stop3",
            time: 4,
            timepoint_id: "t3"
          }
        ],
        start_time: start_time_trip_1 + 20,
        end_time: start_time_trip_1 + 30
      }

      reassign_env(:skate, :schedule_data_get_fn, fn _key, _fallback ->
        {:loaded,
         %Schedule.Data{
           trips: %{trip_1.id => trip_1, trip_2.id => trip_2},
           calendar: %{date_of_trips => ["service"]}
         }}
      end)

      # trip 1 hasn't ended yet
      now =
        date_of_trips
        |> DateTime.new!(Time.new!(0, 0, trip_1.end_time), "America/New_York")
        |> DateTime.add(-5, :second)
        |> DateTime.to_unix()

      vehicle =
        build(:vehicle,
          route_id: trip_2.route_id,
          block_id: "block1",
          direction_id: 1,
          # Vehicle has already started to trip_2, even though it is scheduled to start in the future
          trip_id: trip_2.id
        )

      assert Vehicles.group_by_route(
               [vehicle],
               @timepoint_names_by_id,
               now
             ) == %{
               "first_route" => [],
               "second_route" => [vehicle]
             }
    end
  end

  describe "group_by_route_with_blocks" do
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

    test "groups on_route, laying_over, and pulling_out vehicles together by their route_id" do
      on_route_vehicle = build(:vehicle)

      pulling_out_vehicle =
        build(:vehicle,
          id: "pulling_out",
          label: "pulling_out",
          route_status: :pulling_out
        )

      laying_over_vehicle =
        build(:vehicle,
          id: "laying_over",
          label: "laying_over",
          route_status: :laying_over
        )

      ungrouped_vehicles = [on_route_vehicle, laying_over_vehicle, pulling_out_vehicle]
      pulling_out_blocks_by_route = %{}

      assert Vehicles.group_by_route_with_blocks(
               ungrouped_vehicles,
               pulling_out_blocks_by_route,
               %{},
               %{},
               0,
               @timepoint_names_by_id
             ) == %{
               "route" => [on_route_vehicle, laying_over_vehicle, pulling_out_vehicle]
             }
    end

    test "includes vehicles incoming onto a new route in their new route" do
      vehicle =
        build(:vehicle,
          id: "on_route_1",
          label: "on_route_1",
          route_id: "route1",
          block_id: "block1",
          direction_id: 1
        )

      vehicle_2 =
        build(:vehicle,
          id: "on_route_2",
          label: "on_route_2",
          route_id: "route2",
          trip_id: "trip",
          block_id: "block2"
        )

      trip_1 = %Trip{
        id: "trip",
        block_id: "block1",
        route_id: "route2",
        service_id: "service",
        headsign: "headsign2",
        direction_id: 0,
        stop_times: [
          %StopTime{
            stop_id: "stop3",
            time: 4,
            timepoint_id: "t3"
          }
        ],
        start_time: 4,
        end_time: 4
      }

      trip_2 = %Trip{
        id: "trip2",
        block_id: "block2",
        route_id: "route2",
        service_id: "service",
        headsign: "headsign2",
        direction_id: 0,
        stop_times: [
          %StopTime{
            stop_id: "stop3",
            time: 4,
            timepoint_id: "t3"
          }
        ],
        start_time: 4,
        end_time: 4
      }

      block_1 = build(:block, id: trip_1.block_id, pieces: [build(:piece, trips: [trip_1])])
      block_2 = build(:block, id: trip_2.block_id, pieces: [build(:piece, trips: [trip_2])])

      ungrouped_vehicles = [vehicle, vehicle_2]

      assert Vehicles.group_by_route_with_blocks(
               ungrouped_vehicles,
               [trip_1],
               %{},
               %{~D[2019-12-20] => [block_1, block_2]},
               0,
               @timepoint_names_by_id
             ) == %{
               "route1" => [vehicle],
               "route2" => [
                 vehicle_2,
                 %{vehicle | incoming_trip_direction_id: trip_1.direction_id}
               ]
             }
    end

    test "includes incoming vehicles that aren't currently assigned to a route" do
      vehicle =
        build(:vehicle,
          route_id: nil,
          trip_id: nil
        )

      trip = %Trip{
        id: "trip",
        block_id: "block",
        route_id: "route2",
        service_id: "service",
        headsign: "headsign",
        direction_id: 0,
        stop_times: [
          %StopTime{
            stop_id: "stop1",
            time: 0,
            timepoint_id: "timepoint"
          }
        ],
        start_time: 0,
        end_time: 0
      }

      ungrouped_vehicles = [vehicle]

      assert Vehicles.group_by_route_with_blocks(
               ungrouped_vehicles,
               [trip],
               %{},
               %{},
               0,
               @timepoint_names_by_id
             ) == %{
               "route2" => [%{vehicle | incoming_trip_direction_id: 0}]
             }
    end

    test "includes trip without a vehicle as a ghost" do
      trip =
        build(:trip, %{
          stop_times: [
            build(:gtfs_stoptime, %{
              stop_id: "stop1",
              time: 1,
              timepoint_id: "timepoint"
            })
          ],
          start_time: 0,
          end_time: 3
        })

      piece = build(:piece, trips: [trip], start_time: 0, end_time: 3)
      block = build(:block, pieces: [piece])
      run = build(:run, %{activities: [piece]})

      # 2019-12-20 00:00:00
      time0 = 1_576_818_000

      actual =
        Vehicles.group_by_route_with_blocks(
          [],
          [],
          %{~D[2019-12-20] => [run]},
          %{~D[2019-12-20] => [block]},
          time0,
          @timepoint_names_by_id
        )

      assert %{
               "route" => [
                 %Ghost{
                   id: "ghost-trip",
                   direction_id: 0,
                   route_id: "route",
                   trip_id: "trip",
                   headsign: "headsign",
                   block_id: "block",
                   layover_departure_time: nil,
                   scheduled_timepoint_status: %{
                     timepoint_id: "timepoint",
                     fraction_until_timepoint: 0.0
                   },
                   route_status: :on_route,
                   block_waivers: [
                     %BlockWaiver{
                       remark: "E:1106"
                     }
                   ]
                 }
               ]
             } = actual
    end

    test "doesn't include run as ghost if it has a vehicle on that run" do
      vehicle = build(:vehicle, %{run_id: "run"})

      trip =
        build(:trip, %{
          stop_times: [
            build(:gtfs_stoptime, %{
              stop_id: "stop1",
              time: 1,
              timepoint_id: "timepoint"
            })
          ],
          start_time: 0,
          end_time: 0
        })

      block = build(:block, id: trip.block_id, pieces: [build(:piece, trips: [trip])])

      reassign_env(:skate, :trips_by_id_fn, fn _ ->
        %{
          "trip" => trip
        }
      end)

      run =
        build(:run, %{
          activities: [build(:piece, %{start_time: 0, end_time: 0})]
        })

      # 2019-12-20 00:00:00
      time0 = 1_576_818_000

      assert Vehicles.group_by_route_with_blocks(
               [vehicle],
               %{},
               %{~D[2019-12-20] => [run]},
               %{~D[2019-12-20] => [block]},
               time0,
               @timepoint_names_by_id
             ) == %{
               "route" => [vehicle]
             }
    end

    test "includes scheduled pullout without a vehicle as a ghost" do
      trip =
        build(:trip, %{
          stop_times: [
            build(:gtfs_stoptime, %{
              stop_id: "stop1",
              time: 1,
              timepoint_id: "timepoint"
            })
          ],
          start_time: 1,
          end_time: 1
        })

      piece = build(:piece, trips: [trip], start_time: 0, end_time: 1)
      block = build(:block, id: trip.id, pieces: [piece])

      run = build(:run, %{activities: [piece]})

      # 2019-12-20 00:00:00
      time0 = 1_576_818_000

      assert %{
               "route" => [ghost]
             } =
               Vehicles.group_by_route_with_blocks(
                 [],
                 [trip],
                 %{~D[2019-12-20] => [run]},
                 %{~D[2019-12-20] => [block]},
                 time0,
                 @timepoint_names_by_id
               )

      assert %Ghost{
               id: "ghost-trip",
               direction_id: 0,
               route_id: "route",
               trip_id: "trip",
               headsign: "headsign",
               block_id: "block",
               run_id: "run",
               via_variant: nil,
               layover_departure_time: 1_576_818_001,
               scheduled_timepoint_status: %{
                 timepoint_id: "timepoint",
                 fraction_until_timepoint: 0.0
               },
               route_status: :pulling_out,
               block_waivers: [
                 %{
                   remark: "E:1106"
                 }
               ]
             } = ghost
    end

    test "includes ghosts that are incoming from another route" do
      trip1 =
        build(:trip, %{
          id: "trip1",
          headsign: "headsign1",
          route_id: "route1",
          stop_times: [
            build(
              :gtfs_stoptime,
              %{
                stop_id: "stop1",
                time: 1,
                timepoint_id: "t1"
              }
            ),
            build(
              :gtfs_stoptime,
              %{
                stop_id: "stop2",
                time: 3,
                timepoint_id: "t2"
              }
            )
          ],
          start_time: 1,
          end_time: 2,
          direction_id: 0
        })

      trip2 =
        build(:trip, %{
          id: "trip2",
          headsign: "headsign2",
          route_id: "route2",
          stop_times: [
            build(
              :gtfs_stoptime,
              %{
                stop_id: "stop3",
                time: 4,
                timepoint_id: "t3"
              }
            )
          ],
          start_time: 4,
          end_time: 4,
          direction_id: 1
        })

      piece = build(:piece, %{trips: [trip1, trip2], start_time: 1, end_time: 4})
      block = build(:block, id: trip1.block_id, pieces: [build(:piece, trips: [trip1, trip2])])
      run = build(:run, %{activities: [piece]})
      # 2019-12-20 00:00:00
      time0 = 1_576_818_000

      ghost = %Ghost{
        id: "ghost-trip1",
        direction_id: 0,
        route_id: "route1",
        trip_id: "trip1",
        headsign: "headsign1",
        block_id: "block",
        via_variant: nil,
        layover_departure_time: nil,
        scheduled_timepoint_status: %{
          timepoint_id: "t2",
          fraction_until_timepoint: 0.5
        },
        current_piece_first_route: "route1",
        current_piece_start_place: "Somerville Garage",
        run_id: "run",
        scheduled_logon: 1_576_818_001,
        route_status: :on_route,
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

      assert Vehicles.group_by_route_with_blocks(
               [],
               [trip1, trip2],
               %{~D[2019-12-20] => [run]},
               %{~D[2019-12-20] => [block]},
               time0 + 2,
               @timepoint_names_by_id
             ) == %{
               "route1" => [ghost],
               "route2" => [%{ghost | incoming_trip_direction_id: 1}]
             }
    end

    test "orders vehicles/ghosts by the time that they enter the route" do
      # 2019-12-20 00:00:00
      time0 = 1_576_818_000

      vehicle_1 =
        build(:vehicle,
          id: "on_route_1",
          label: "on_route_1",
          route_id: "route1",
          trip_id: "trip",
          block_id: "block_1",
          run_id: "run_1"
        )

      vehicle_2 =
        build(:vehicle,
          id: "on_route_2",
          label: "on_route_2",
          route_id: "route2",
          trip_id: "trip",
          block_id: "block_2",
          run_id: "run_2"
        )

      vehicle_3 =
        build(:vehicle,
          id: "on_nil_route",
          label: "on_nil_route",
          route_id: nil,
          trip_id: "trip",
          block_id: "block_3",
          run_id: "run_3"
        )

      vehicle_4 =
        build(:vehicle,
          id: "pulling_out",
          label: "pulling_out",
          route_id: "route99",
          trip_id: nil,
          block_id: "",
          layover_departure_time: time0 + 5000,
          route_status: :pulling_out
        )

      trip_1 =
        build(:trip, %{
          id: "trip_1",
          block_id: "block_1",
          run_id: "run_1",
          route_id: "route99",
          headsign: "headsign2",
          stop_times: [
            build(:gtfs_stoptime, %{
              stop_id: "stop3",
              time: 4000,
              timepoint_id: "t3"
            })
          ],
          start_time: 4000,
          end_time: 4100
        })

      trip_2 =
        build(:trip, %{
          id: "trip_2",
          block_id: "block_2",
          run_id: "run_2",
          route_id: "route99",
          headsign: "headsign2",
          stop_times: [
            build(:gtfs_stoptime, %{
              stop_id: "stop3",
              time: 2000,
              timepoint_id: "t3"
            })
          ],
          start_time: 2000,
          end_time: 2100
        })

      trip_3 =
        build(:trip, %{
          id: "trip_3",
          block_id: "block_3",
          run_id: "run_3",
          route_id: "route99",
          headsign: "headsign2",
          stop_times: [
            build(:gtfs_stoptime, %{
              stop_id: "stop3",
              time: 6000,
              timepoint_id: "t3"
            })
          ],
          start_time: 6000,
          end_time: 6100
        })

      block_1 = build(:block, id: trip_1.block_id, pieces: [build(:piece, trips: [trip_1])])
      block_2 = build(:block, id: trip_2.block_id, pieces: [build(:piece, trips: [trip_2])])
      block_3 = build(:block, id: trip_3.block_id, pieces: [build(:piece, trips: [trip_3])])

      run_1 =
        build(:run, %{
          id: "run_1",
          activities: [build(:piece, %{start_time: 4000, end_time: 4100})]
        })

      run_2 =
        build(:run, %{
          id: "run_2",
          activities: [build(:piece, %{start_time: 2000, end_time: 2100})]
        })

      run_3 =
        build(:run, %{
          id: "run_3",
          activities: [build(:piece, %{start_time: 6000, end_time: 6100})]
        })

      reassign_env(:skate, :trips_by_id_fn, fn _ ->
        %{
          "trip_1" => trip_1,
          "trip_2" => trip_2,
          "trip_3" => trip_3
        }
      end)

      ungrouped_vehicles = [vehicle_1, vehicle_2, vehicle_3, vehicle_4]

      assert [
               %Vehicle{id: "on_route_2"},
               %Vehicle{id: "on_route_1"},
               %Vehicle{id: "pulling_out"},
               %Vehicle{id: "on_nil_route"}
             ] =
               Vehicles.group_by_route_with_blocks(
                 ungrouped_vehicles,
                 [trip_1, trip_2, trip_3],
                 %{~D[2019-12-20] => [run_1, run_2, run_3]},
                 %{~D[2019-12-20] => [block_1, block_2, block_3]},
                 time0 + 2,
                 @timepoint_names_by_id
               )
               |> Map.fetch!("route99")
    end
  end

  describe "incoming_blocks_and_directions_by_route/1" do
    test "returns a block in multiple routes if it's active in both" do
      incoming_trips = [
        %Trip{
          id: "first",
          block_id: "block",
          route_id: "first",
          start_time: 0,
          direction_id: 0
        },
        %Trip{
          id: "second",
          block_id: "block",
          route_id: "second",
          start_time: 10,
          direction_id: 1
        }
      ]

      assert Vehicles.incoming_blocks_and_directions_by_route(incoming_trips) == %{
               "first" => [{"block", 0}],
               "second" => [{"block", 1}]
             }
    end

    test "returns a block only once per route if it has multiple active trips" do
      incoming_trips = [
        %Trip{
          id: "second",
          block_id: "block",
          route_id: "route",
          start_time: 10,
          direction_id: 1
        },
        %Trip{
          id: "first",
          block_id: "block",
          route_id: "route",
          start_time: 0,
          direction_id: 0
        }
      ]

      assert Vehicles.incoming_blocks_and_directions_by_route(incoming_trips) == %{
               "route" => [{"block", 0}]
             }
    end
  end
end
