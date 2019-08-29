defmodule Realtime.VehiclesTest do
  use ExUnit.Case, async: true

  alias Gtfs.StopTime
  alias Gtfs.Trip
  alias Realtime.Ghost
  alias Realtime.Vehicle
  alias Realtime.Vehicles

  describe "group_by_route_with_blocks" do
    test "separates incoming vehicles out of the realtime feed" do
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
        speed: 0,
        stop_sequence: 0,
        block_id: "block",
        operator_id: "",
        operator_name: "",
        run_id: "",
        headway_spacing: :ok,
        is_off_course: false,
        is_laying_over: false,
        layover_departure_time: nil,
        block_is_active: true,
        sources: "",
        stop_status: "",
        route_status: :on_route
      }

      incoming_vehicle = %Vehicle{
        id: "incoming",
        label: "incoming",
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        direction_id: 1,
        route_id: "route",
        trip_id: "trip",
        bearing: 0,
        speed: 0,
        stop_sequence: 0,
        block_id: "block",
        operator_id: "",
        operator_name: "",
        run_id: "",
        headway_spacing: :ok,
        is_off_course: false,
        is_laying_over: false,
        layover_departure_time: nil,
        block_is_active: true,
        sources: "",
        stop_status: "",
        route_status: :incoming
      }

      ungrouped_vehicles = [on_route_vehicle, incoming_vehicle]
      incoming_blocks_by_route = %{}

      assert Vehicles.group_by_route_with_blocks(
               ungrouped_vehicles,
               incoming_blocks_by_route,
               [],
               0
             ) == %{
               "route" => %{
                 on_route_vehicles: [on_route_vehicle],
                 incoming_vehicles: [incoming_vehicle],
                 ghosts: []
               }
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
        speed: 0,
        stop_sequence: 0,
        block_id: "block",
        operator_id: "",
        operator_name: "",
        run_id: "",
        headway_spacing: :ok,
        is_off_course: false,
        is_laying_over: false,
        layover_departure_time: nil,
        block_is_active: true,
        sources: "",
        stop_status: "",
        route_status: :on_route
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
        speed: 0,
        stop_sequence: 0,
        block_id: "block",
        operator_id: "",
        operator_name: "",
        run_id: "",
        headway_spacing: :ok,
        is_off_course: false,
        is_laying_over: false,
        layover_departure_time: nil,
        block_is_active: true,
        sources: "",
        stop_status: "",
        route_status: :on_route
      }

      ungrouped_vehicles = [vehicle, vehicle_2]
      incoming_blocks_by_route = %{"route2" => ["block"]}

      assert Vehicles.group_by_route_with_blocks(
               ungrouped_vehicles,
               incoming_blocks_by_route,
               [],
               0
             ) == %{
               "route1" => %{
                 on_route_vehicles: [vehicle],
                 incoming_vehicles: [],
                 ghosts: []
               },
               "route2" => %{
                 on_route_vehicles: [vehicle_2],
                 incoming_vehicles: [vehicle],
                 ghosts: []
               }
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
        speed: 0,
        stop_sequence: 0,
        block_id: "block",
        operator_id: "",
        operator_name: "",
        run_id: "",
        headway_spacing: :ok,
        is_off_course: false,
        is_laying_over: false,
        layover_departure_time: nil,
        block_is_active: true,
        sources: "",
        stop_status: "",
        route_status: :on_route
      }

      ungrouped_vehicles = [vehicle]
      incoming_blocks_by_route = %{"route2" => ["block"]}

      assert Vehicles.group_by_route_with_blocks(
               ungrouped_vehicles,
               incoming_blocks_by_route,
               [],
               0
             ) == %{
               "route2" => %{
                 on_route_vehicles: [],
                 incoming_vehicles: [vehicle],
                 ghosts: []
               }
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
        stop_times: [
          %StopTime{
            stop_id: "stop",
            time: 0,
            timepoint_id: "timepoint"
          }
        ]
      }

      assert Vehicles.group_by_route_with_blocks(
               [],
               %{},
               [trip],
               0
             ) == %{
               "route" => %{
                 on_route_vehicles: [],
                 incoming_vehicles: [],
                 ghosts: [
                   %Ghost{
                     id: "ghost-trip",
                     direction_id: 0,
                     route_id: "route",
                     trip_id: "trip",
                     block_id: "block",
                     scheduled_timepoint_status: %{
                       timepoint_id: "timepoint",
                       fraction_until_timepoint: 0.0
                     }
                   }
                 ]
               }
             }
    end

    test "doesn't include trip as ghost if it has a vehicle on that block" do
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
        speed: 0,
        stop_sequence: 0,
        block_id: "block",
        operator_id: "",
        operator_name: "",
        run_id: "",
        headway_spacing: :ok,
        is_off_course: false,
        is_laying_over: false,
        layover_departure_time: nil,
        block_is_active: true,
        sources: "",
        stop_status: "",
        route_status: :on_route
      }

      trip = %Trip{
        id: "trip",
        route_id: "route",
        service_id: "service",
        headsign: "headsign",
        direction_id: 0,
        block_id: "block",
        stop_times: [
          %StopTime{
            stop_id: "stop",
            time: 0,
            timepoint_id: "timepoint"
          }
        ]
      }

      assert Vehicles.group_by_route_with_blocks(
               [vehicle],
               %{},
               [trip],
               0
             ) == %{
               "route" => %{
                 on_route_vehicles: [vehicle],
                 incoming_vehicles: [],
                 ghosts: []
               }
             }
    end
  end
end
