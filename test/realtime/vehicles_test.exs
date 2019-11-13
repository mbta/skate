defmodule Realtime.VehiclesTest do
  use ExUnit.Case, async: true

  alias Gtfs.StopTime
  alias Gtfs.Trip
  alias Realtime.Ghost
  alias Realtime.Vehicle
  alias Realtime.Vehicles

  describe "group_by_route_with_blocks" do
    test "groups on_route, laying_over, and incoming vehicles together by their route_id" do
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
        route_status: :on_route
      }

      incoming_vehicle = %{
        on_route_vehicle
        | id: "incoming",
          label: "incoming",
          route_status: :incoming
      }

      laying_over_vehicle = %{
        on_route_vehicle
        | id: "laying_over",
          label: "laying_over",
          route_status: :laying_over
      }

      ungrouped_vehicles = [on_route_vehicle, laying_over_vehicle, incoming_vehicle]
      incoming_blocks_by_route = %{}

      assert Vehicles.group_by_route_with_blocks(
               ungrouped_vehicles,
               incoming_blocks_by_route,
               [],
               0
             ) == %{
               "route" => [on_route_vehicle, laying_over_vehicle, incoming_vehicle]
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
               "route" => [
                 %Ghost{
                   id: "ghost-trip",
                   direction_id: 0,
                   route_id: "route",
                   trip_id: "trip",
                   headsign: "headsign",
                   block_id: "block",
                   scheduled_timepoint_status: %{
                     timepoint_id: "timepoint",
                     fraction_until_timepoint: 0.0
                   }
                 }
               ]
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
        route_status: :on_route
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

      assert Vehicles.group_by_route_with_blocks(
               [vehicle],
               %{},
               [trip],
               0
             ) == %{
               "route" => [vehicle]
             }
    end
  end
end
