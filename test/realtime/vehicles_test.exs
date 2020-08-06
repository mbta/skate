defmodule Realtime.VehiclesTest do
  use ExUnit.Case
  import Test.Support.Helpers

  alias Schedule.{Block, Trip}
  alias Schedule.Gtfs.StopTime
  alias Realtime.{BlockWaiver, Ghost, Vehicle, Vehicles}

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
      on_route_vehicle = %Vehicle{
        id: "on_route",
        label: "on_route",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        direction_id: 1,
        route_id: "route",
        trip_id: "trip",
        bearing: 0,
        block_id: "block",
        operator_id: "",
        operator_name: "",
        operator_logon_time: nil,
        run_id: "",
        headway_spacing: :ok,
        is_shuttle: false,
        is_overload: false,
        is_off_course: false,
        layover_departure_time: nil,
        block_is_active: true,
        sources: "",
        stop_status: "",
        route_status: :on_route,
        end_of_trip_type: :another_trip
      }

      pulling_out_vehicle = %{
        on_route_vehicle
        | id: "pulling_out",
          label: "pulling_out",
          route_status: :pulling_out
      }

      laying_over_vehicle = %{
        on_route_vehicle
        | id: "laying_over",
          label: "laying_over",
          route_status: :laying_over
      }

      ungrouped_vehicles = [on_route_vehicle, laying_over_vehicle, pulling_out_vehicle]
      pulling_out_blocks_by_route = %{}

      assert Vehicles.group_by_route_with_blocks(
               ungrouped_vehicles,
               pulling_out_blocks_by_route,
               %{},
               0
             ) == %{
               "route" => [on_route_vehicle, laying_over_vehicle, pulling_out_vehicle]
             }
    end

    test "includes vehicles incoming onto a new route in their new route" do
      vehicle = %Vehicle{
        id: "on_route_1",
        label: "on_route_1",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        direction_id: 1,
        route_id: "route1",
        trip_id: "trip",
        bearing: 0,
        block_id: "block",
        operator_id: "",
        operator_name: "",
        operator_logon_time: nil,
        run_id: "",
        headway_spacing: :ok,
        is_shuttle: false,
        is_overload: false,
        is_off_course: false,
        layover_departure_time: nil,
        block_is_active: true,
        sources: "",
        stop_status: "",
        route_status: :on_route,
        end_of_trip_type: :another_trip
      }

      vehicle_2 = %Vehicle{
        id: "on_route_2",
        label: "on_route_2",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        direction_id: 1,
        route_id: "route2",
        trip_id: "trip",
        bearing: 0,
        block_id: "block",
        operator_id: "",
        operator_name: "",
        operator_logon_time: nil,
        run_id: "",
        headway_spacing: :ok,
        is_shuttle: false,
        is_overload: false,
        is_off_course: false,
        layover_departure_time: nil,
        block_is_active: true,
        sources: "",
        stop_status: "",
        route_status: :on_route,
        end_of_trip_type: :another_trip
      }

      trip = %Trip{
        id: "trip",
        block_id: "block",
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

      ungrouped_vehicles = [vehicle, vehicle_2]

      assert Vehicles.group_by_route_with_blocks(
               ungrouped_vehicles,
               [trip],
               %{},
               0
             ) == %{
               "route1" => [vehicle],
               "route2" => [vehicle_2, vehicle]
             }
    end

    test "includes incoming vehicles that aren't currently assigned to a route" do
      vehicle = %Vehicle{
        id: "on_route",
        label: "on_route",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        direction_id: nil,
        route_id: nil,
        trip_id: nil,
        bearing: 0,
        block_id: "block",
        operator_id: "",
        operator_name: "",
        operator_logon_time: nil,
        run_id: "",
        headway_spacing: :ok,
        is_shuttle: false,
        is_overload: false,
        is_off_course: false,
        layover_departure_time: nil,
        block_is_active: true,
        sources: "",
        stop_status: "",
        route_status: :on_route,
        end_of_trip_type: :another_trip
      }

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
               0
             ) == %{
               "route2" => [vehicle]
             }
    end

    test "includes trip without a vehicle as a ghost" do
      trip = %Trip{
        id: "trip",
        block_id: "block",
        route_id: "route",
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

      block = Block.block_from_trips([trip])

      # 2019-12-20 00:00:00
      time0 = 1_576_818_000

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
             } =
               Vehicles.group_by_route_with_blocks(
                 [],
                 %{},
                 %{~D[2019-12-20] => [block]},
                 time0
               )
    end

    test "doesn't include block as ghost if it has a vehicle on that block" do
      vehicle = %Vehicle{
        id: "on_route",
        label: "on_route",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        direction_id: nil,
        route_id: "route",
        trip_id: nil,
        bearing: 0,
        block_id: "block",
        operator_id: "",
        operator_name: "",
        operator_logon_time: nil,
        run_id: "",
        headway_spacing: :ok,
        is_shuttle: false,
        is_overload: false,
        is_off_course: false,
        layover_departure_time: nil,
        block_is_active: true,
        sources: "",
        stop_status: "",
        route_status: :on_route,
        end_of_trip_type: :another_trip
      }

      trip = %Trip{
        id: "trip",
        block_id: "block",
        route_id: "route",
        service_id: "service",
        headsign: "headsign",
        direction_id: 0,
        stop_times: [
          %StopTime{
            stop_id: "stop",
            time: 0,
            timepoint_id: "timepoint"
          }
        ],
        start_time: 0,
        end_time: 0
      }

      block = Block.block_from_trips([trip])

      # 2019-12-20 00:00:00
      time0 = 1_576_818_000

      assert Vehicles.group_by_route_with_blocks(
               [vehicle],
               %{},
               %{~D[2019-12-20] => [block]},
               time0
             ) == %{
               "route" => [vehicle]
             }
    end

    test "includes scheduled pullout without a vehicle as a ghost" do
      vehicles = []

      trip = %Trip{
        id: "trip",
        block_id: "block",
        route_id: "route",
        service_id: "service",
        headsign: "headsign",
        direction_id: 0,
        stop_times: [
          %StopTime{
            stop_id: "stop1",
            time: 1,
            timepoint_id: "timepoint"
          }
        ],
        start_time: 1,
        end_time: 1
      }

      block = Block.block_from_trips([trip])
      # 2019-12-20 00:00:00
      time0 = 1_576_818_000

      blocks_by_date = %{~D[2019-12-20] => [block]}

      assert %{
               "route" => [ghost]
             } =
               Vehicles.group_by_route_with_blocks(
                 vehicles,
                 [trip],
                 blocks_by_date,
                 time0
               )

      assert %Ghost{
               id: "ghost-trip",
               direction_id: 0,
               route_id: "route",
               trip_id: "trip",
               headsign: "headsign",
               block_id: "block",
               run_id: nil,
               via_variant: nil,
               layover_departure_time: 1_576_818_001,
               scheduled_timepoint_status: %{
                 timepoint_id: "timepoint",
                 fraction_until_timepoint: 0.0
               },
               route_status: :pulling_out,
               block_waivers: [
                 %BlockWaiver{
                   remark: "E:1106"
                 }
               ]
             } = ghost
    end

    test "includes ghosts that are incoming from another route" do
      vehicles = []

      trip1 = %Trip{
        id: "trip1",
        block_id: "block",
        route_id: "route1",
        service_id: "service",
        headsign: "headsign1",
        direction_id: 0,
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
        ],
        start_time: 1,
        end_time: 3
      }

      trip2 = %Trip{
        id: "trip2",
        block_id: "block",
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

      block = Block.block_from_trips([trip1, trip2])

      # 2019-12-20 00:00:00
      time0 = 1_576_818_000

      blocks_by_date = %{~D[2019-12-20] => [block]}

      ghost = %Ghost{
        id: "ghost-trip1",
        direction_id: 0,
        route_id: "route1",
        trip_id: "trip1",
        headsign: "headsign1",
        block_id: "block",
        run_id: nil,
        via_variant: nil,
        layover_departure_time: nil,
        scheduled_timepoint_status: %{
          timepoint_id: "t2",
          fraction_until_timepoint: 0.5
        },
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
               vehicles,
               [trip1, trip2],
               blocks_by_date,
               time0 + 2
             ) == %{
               "route1" => [ghost],
               "route2" => [ghost]
             }
    end

    test "orders vehicles/ghosts by the time that they enter the route" do
      vehicle_1 = %Vehicle{
        id: "on_route_1",
        label: "on_route_1",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        direction_id: 1,
        route_id: "route1",
        trip_id: "trip",
        bearing: 0,
        block_id: "block_1",
        operator_id: "",
        operator_name: "",
        operator_logon_time: nil,
        run_id: "",
        headway_spacing: :ok,
        is_shuttle: false,
        is_overload: false,
        is_off_course: false,
        layover_departure_time: nil,
        block_is_active: true,
        sources: "",
        stop_status: "",
        route_status: :on_route,
        end_of_trip_type: :another_trip
      }

      vehicle_2 = %Vehicle{
        id: "on_route_2",
        label: "on_route_2",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        direction_id: 1,
        route_id: "route2",
        trip_id: "trip",
        bearing: 0,
        block_id: "block_2",
        operator_id: "",
        operator_name: "",
        operator_logon_time: nil,
        run_id: "",
        headway_spacing: :ok,
        is_shuttle: false,
        is_overload: false,
        is_off_course: false,
        layover_departure_time: nil,
        block_is_active: true,
        sources: "",
        stop_status: "",
        route_status: :on_route,
        end_of_trip_type: :another_trip
      }

      vehicle_3 = %Vehicle{
        id: "on_nil_route",
        label: "on_nil_route",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        direction_id: 1,
        route_id: nil,
        trip_id: "trip",
        bearing: 0,
        block_id: "block_3",
        operator_id: "",
        operator_name: "",
        operator_logon_time: nil,
        run_id: "",
        headway_spacing: :ok,
        is_shuttle: false,
        is_overload: false,
        is_off_course: false,
        layover_departure_time: nil,
        block_is_active: true,
        sources: "",
        stop_status: "",
        route_status: :on_route,
        end_of_trip_type: :another_trip
      }

      trip_1 = %Trip{
        id: "trip_1",
        block_id: "block_1",
        route_id: "route99",
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
        id: "trip_2",
        block_id: "block_2",
        route_id: "route99",
        service_id: "service",
        headsign: "headsign2",
        direction_id: 0,
        stop_times: [
          %StopTime{
            stop_id: "stop3",
            time: 2,
            timepoint_id: "t3"
          }
        ],
        start_time: 2,
        end_time: 2
      }

      trip_3 = %Trip{
        id: "trip_3",
        block_id: "block_3",
        route_id: "route99",
        service_id: "service",
        headsign: "headsign2",
        direction_id: 0,
        stop_times: [
          %StopTime{
            stop_id: "stop3",
            time: 6,
            timepoint_id: "t3"
          }
        ],
        start_time: 6,
        end_time: 6
      }

      block = Block.block_from_trips([trip_1, trip_2, trip_3])
      ungrouped_vehicles = [vehicle_1, vehicle_2, vehicle_3]
      blocks_by_date = %{~D[2019-12-20] => [block]}

      # 2019-12-20 00:00:00
      time0 = 1_576_818_000

      assert [
               %Vehicle{id: "on_route_2"},
               %Vehicle{id: "on_route_1"},
               %Vehicle{id: "on_nil_route"}
             ] =
               Vehicles.group_by_route_with_blocks(
                 ungrouped_vehicles,
                 block.trips,
                 blocks_by_date,
                 time0 + 2
               )
               |> Map.fetch!("route99")
    end
  end

  describe "incoming_blocks_by_route" do
    test "returns a block in multiple routes if it's active in both" do
      incoming_trips = [
        %Trip{
          id: "first",
          block_id: "block",
          route_id: "first"
        },
        %Trip{
          id: "second",
          block_id: "block",
          route_id: "second"
        }
      ]

      assert Vehicles.incoming_blocks_by_route(incoming_trips) == %{
               "first" => ["block"],
               "second" => ["block"]
             }
    end

    test "returns a block only once per route if it has multiple active trips" do
      incoming_trips = [
        %Trip{
          id: "first",
          block_id: "block",
          route_id: "route"
        },
        %Trip{
          id: "second",
          block_id: "block",
          route_id: "route"
        }
      ]

      assert Vehicles.incoming_blocks_by_route(incoming_trips) == %{"route" => ["block"]}
    end
  end
end
