defmodule Realtime.VehiclesTest do
  use ExUnit.Case, async: true

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
        block_is_active: true,
        sources: "",
        stop_status: "",
        route_status: :incoming
      }

      ungrouped_vehicles = [on_route_vehicle, incoming_vehicle]
      incoming_blocks_by_route = %{}

      assert Vehicles.group_by_route_with_blocks(
               ungrouped_vehicles,
               incoming_blocks_by_route
             ) == %{
               "route" => %{
                 on_route_vehicles: [on_route_vehicle],
                 incoming_vehicles: [incoming_vehicle]
               }
             }
    end

    test "includes vehicles incoming onto a new route in their new route" do
      vehicle = %Vehicle{
        id: "on_route",
        label: "on_route",
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
        block_is_active: true,
        sources: "",
        stop_status: "",
        route_status: :on_route
      }

      ungrouped_vehicles = [vehicle]
      incoming_blocks_by_route = %{"route2" => ["block"]}

      assert Vehicles.group_by_route_with_blocks(
               ungrouped_vehicles,
               incoming_blocks_by_route
             ) == %{
               "route1" => %{
                 on_route_vehicles: [vehicle],
                 incoming_vehicles: []
               },
               "route2" => %{
                 on_route_vehicles: [],
                 incoming_vehicles: [vehicle]
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
        block_is_active: true,
        sources: "",
        stop_status: "",
        route_status: :on_route
      }

      ungrouped_vehicles = [vehicle]
      incoming_blocks_by_route = %{"route2" => ["block"]}

      assert Vehicles.group_by_route_with_blocks(
               ungrouped_vehicles,
               incoming_blocks_by_route
             ) == %{
               "route2" => %{
                 on_route_vehicles: [],
                 incoming_vehicles: [vehicle]
               }
             }
    end
  end
end
