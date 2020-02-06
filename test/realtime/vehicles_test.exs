defmodule Realtime.VehiclesTest do
  use ExUnit.Case, async: true
  import Test.Support.Helpers

  alias Concentrate.StopTimeUpdate
  alias Gtfs.{StopTime, Trip}
  alias Realtime.{BlockWaiver, Ghost, Vehicle, Vehicles}

  describe "group_by_route_with_blocks" do
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
        run_id: "",
        headway_spacing: :ok,
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
               [],
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
        run_id: "",
        headway_spacing: :ok,
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
        run_id: "",
        headway_spacing: :ok,
        is_off_course: false,
        layover_departure_time: nil,
        block_is_active: true,
        sources: "",
        stop_status: "",
        route_status: :on_route,
        end_of_trip_type: :another_trip
      }

      ungrouped_vehicles = [vehicle, vehicle_2]
      incoming_blocks_by_route = %{"route2" => ["block"]}

      assert Vehicles.group_by_route_with_blocks(
               ungrouped_vehicles,
               incoming_blocks_by_route,
               [],
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
        run_id: "",
        headway_spacing: :ok,
        is_off_course: false,
        layover_departure_time: nil,
        block_is_active: true,
        sources: "",
        stop_status: "",
        route_status: :on_route,
        end_of_trip_type: :another_trip
      }

      ungrouped_vehicles = [vehicle]
      incoming_blocks_by_route = %{"route2" => ["block"]}

      assert Vehicles.group_by_route_with_blocks(
               ungrouped_vehicles,
               incoming_blocks_by_route,
               [],
               0
             ) == %{
               "route2" => [vehicle]
             }
    end

    test "includes trip without a vehicle as a ghost" do
      trip = %Trip{
        id: "trip",
        route_id: "route",
        service_id: "service",
        headsign: "headsign",
        direction_id: 0,
        block_id: "block",
        shape_id: "shape1",
        stop_times: [
          %StopTime{
            stop_id: "stop1",
            time: 0,
            timepoint_id: "timepoint"
          }
        ]
      }

      block = [trip]

      # 2019-12-20 00:00:00
      time0 = 1_576_818_000

      assert Vehicles.group_by_route_with_blocks(
               [],
               %{},
               %{~D[2019-12-20] => [block]},
               time0
             ) == %{
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
                   block_waivers: %{
                     "trip" => %BlockWaiver{
                       trip_id: "trip",
                       start_time: 0,
                       end_time: 0,
                       remark: "E:1106"
                     }
                   }
                 }
               ]
             }
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
        run_id: "",
        headway_spacing: :ok,
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
        route_id: "route",
        service_id: "service",
        headsign: "headsign",
        direction_id: 0,
        block_id: "block",
        shape_id: "shape1",
        stop_times: [
          %StopTime{
            stop_id: "stop",
            time: 0,
            timepoint_id: "timepoint"
          }
        ]
      }

      block = [trip]

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
      incoming_blocks_by_route = %{"route" => ["block"]}

      trip = %Trip{
        id: "trip",
        route_id: "route",
        service_id: "service",
        headsign: "headsign",
        direction_id: 0,
        block_id: "block",
        shape_id: "shape",
        stop_times: [
          %StopTime{
            stop_id: "stop1",
            time: 1,
            timepoint_id: "timepoint"
          }
        ]
      }

      block = [trip]
      # 2019-12-20 00:00:00
      time0 = 1_576_818_000

      blocks_by_date = %{~D[2019-12-20] => [block]}

      ghost = %Ghost{
        id: "ghost-trip",
        direction_id: 0,
        route_id: "route",
        trip_id: "trip",
        headsign: "headsign",
        block_id: "block",
        run_id: nil,
        via_variant: nil,
        layover_departure_time: time0 + 1,
        scheduled_timepoint_status: %{
          timepoint_id: "timepoint",
          fraction_until_timepoint: 0.0
        },
        route_status: :pulling_out,
        block_waivers: %{
          "trip" => %BlockWaiver{
            trip_id: "trip",
            start_time: 1,
            end_time: 1,
            remark: "E:1106"
          }
        }
      }

      assert Vehicles.group_by_route_with_blocks(
               vehicles,
               incoming_blocks_by_route,
               blocks_by_date,
               time0
             ) == %{
               "route" => [ghost]
             }
    end

    test "includes ghosts that are incoming from another route" do
      vehicles = []

      incoming_blocks_by_route = %{
        "route1" => ["block"],
        "route2" => ["block"]
      }

      trip1 = %Trip{
        id: "trip1",
        route_id: "route1",
        service_id: "service",
        headsign: "headsign1",
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

      trip2 = %Trip{
        id: "trip2",
        route_id: "route2",
        service_id: "service",
        headsign: "headsign2",
        direction_id: 0,
        block_id: "block",
        shape_id: "shape2",
        stop_times: [
          %StopTime{
            stop_id: "stop3",
            time: 4,
            timepoint_id: "t3"
          }
        ]
      }

      block = [trip1, trip2]

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
        route_status: :on_route
      }

      assert Vehicles.group_by_route_with_blocks(
               vehicles,
               incoming_blocks_by_route,
               blocks_by_date,
               time0 + 2
             ) == %{
               "route1" => [ghost],
               "route2" => [ghost]
             }
    end
  end

  describe "incoming_blocks_by_route" do
    test "returns a block in multiple routes if it's active in both" do
      incoming_trips = [
        %Trip{
          id: "first",
          route_id: "first",
          service_id: "today",
          headsign: "headsign",
          direction_id: 0,
          block_id: "block",
          shape_id: "shape1",
          stop_times: [
            %StopTime{
              stop_id: "stop",
              time: 2
            }
          ]
        },
        %Trip{
          id: "second",
          route_id: "second",
          service_id: "today",
          headsign: "headsign",
          direction_id: 0,
          block_id: "block",
          shape_id: "shape1",
          stop_times: [
            %StopTime{
              stop_id: "stop",
              time: 3
            }
          ]
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
          route_id: "route",
          service_id: "today",
          headsign: "headsign",
          direction_id: 0,
          block_id: "block",
          shape_id: "shape1",
          stop_times: [
            %StopTime{
              stop_id: "stop",
              time: 2
            }
          ]
        },
        %Trip{
          id: "second",
          route_id: "route",
          service_id: "today",
          headsign: "headsign",
          direction_id: 0,
          block_id: "block",
          shape_id: "shape1",
          stop_times: [
            %StopTime{
              stop_id: "stop",
              time: 3
            }
          ]
        }
      ]

      assert Vehicles.incoming_blocks_by_route(incoming_trips) == %{"route" => ["block"]}
    end
  end
end
