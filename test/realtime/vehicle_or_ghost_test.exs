defmodule Realtime.VehicleOrGhostTest do
  use ExUnit.Case

  alias Realtime.{Ghost, Vehicle, VehicleOrGhost}

  @vehicle %Vehicle{
    id: "vehicle1",
    label: "v1-label",
    timestamp: 1_558_121_727,
    latitude: 42.3408556,
    longitude: -71.0642766,
    direction_id: 0,
    route_id: "vehicle-route-1",
    trip_id: "vehicle-trip-1",
    bearing: nil,
    stop_sequence: 1,
    block_id: "A505-106",
    operator_id: "71041",
    operator_name: "FRANK",
    run_id: "vehicle-run-1",
    headway_secs: 600,
    headway_spacing: :ok,
    is_off_course: false,
    is_laying_over: false,
    layover_departure_time: nil,
    block_is_active: true,
    sources: MapSet.new(["swiftly"]),
    data_discrepancies: [],
    stop_status: %{
      status: :in_transit_to,
      stop_id: "s1"
    },
    timepoint_status: %{
      timepoint_id: "tp1",
      fraction_until_timepoint: 0.2
    },
    route_status: :on_route
  }

  @ghost %Ghost{
    id: "ghost1",
    direction_id: 0,
    route_id: "ghost-route-1",
    trip_id: "ghost-trip-1",
    headsign: "headsign",
    block_id: "block",
    run_id: "ghost-run-1",
    via_variant: "X",
    scheduled_timepoint_status: %{
      timepoint_id: "t2",
      fraction_until_timepoint: 0.5
    }
  }

  @vehicles [@vehicle, @ghost]

  describe "find_by/2" do
    test "matches on any of run, vehicle, or operator" do
      assert VehicleOrGhost.find_by(@vehicles, %{text: "vehicle-run-1", property: :all}) ==
               [@vehicle]

      assert VehicleOrGhost.find_by(@vehicles, %{text: "ghost", property: :all}) ==
               [@ghost]

      assert VehicleOrGhost.find_by(@vehicles, %{text: "frank", property: :all}) ==
               [@vehicle]

      assert VehicleOrGhost.find_by(@vehicles, %{text: "710", property: :all}) ==
               [@vehicle]
    end

    test "matches on run ID" do
      assert VehicleOrGhost.find_by(@vehicles, %{text: "run1", property: :run}) == @vehicles

      assert VehicleOrGhost.find_by(@vehicles, %{text: "vehicle", property: :run}) ==
               [@vehicle]
    end

    test "matches on vehicle ID" do
      assert VehicleOrGhost.find_by(@vehicles, %{text: "1", property: :vehicle}) == @vehicles

      assert VehicleOrGhost.find_by(@vehicles, %{text: "ghost", property: :vehicle}) ==
               [@ghost]
    end

    test "matches on operator name" do
      assert VehicleOrGhost.find_by(@vehicles, %{text: "frank", property: :operator}) ==
               [@vehicle]
    end

    test "matches on operator ID" do
      assert VehicleOrGhost.find_by(@vehicles, %{text: "710", property: :operator}) ==
               [@vehicle]
    end
  end
end
