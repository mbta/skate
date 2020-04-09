defmodule Realtime.VehicleOrGhostTest do
  use ExUnit.Case, async: true

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
    block_id: "A505-106",
    operator_id: "71041",
    operator_name: "FRANK",
    operator_logon_time: 1_558_121_726,
    run_id: "vehicle-run-1",
    headway_secs: 600,
    headway_spacing: :ok,
    is_shuttle: false,
    is_overload: false,
    is_off_course: false,
    layover_departure_time: nil,
    block_is_active: true,
    sources: MapSet.new(["swiftly"]),
    data_discrepancies: [],
    stop_status: %{
      stop_id: "s1"
    },
    timepoint_status: %{
      timepoint_id: "tp1",
      fraction_until_timepoint: 0.2
    },
    route_status: :on_route,
    end_of_trip_type: :another_trip
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
    layover_departure_time: nil,
    scheduled_timepoint_status: %{
      timepoint_id: "t2",
      fraction_until_timepoint: 0.5
    },
    route_status: :on_route
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

    test "matches run id with or without spaces and hyphens" do
      assert VehicleOrGhost.find_by([@vehicle], %{text: "vehiclerun", property: :run}) ==
               [@vehicle]

      assert VehicleOrGhost.find_by([@vehicle], %{text: "vehicle-run", property: :run}) ==
               [@vehicle]

      assert VehicleOrGhost.find_by([@vehicle], %{text: "vehicle run", property: :run}) ==
               [@vehicle]
    end

    test "matches shuttle run even without the leading 0" do
      shuttle = %{@vehicle | run_id: "999-0504"}

      assert VehicleOrGhost.find_by([shuttle], %{text: "504", property: :run}) ==
               [shuttle]

      assert VehicleOrGhost.find_by([shuttle], %{text: "999504", property: :run}) ==
               [shuttle]

      assert VehicleOrGhost.find_by([shuttle], %{text: "999-0504", property: :run}) ==
               [shuttle]
    end

    test "matches on vehicle ID" do
      assert VehicleOrGhost.find_by([@vehicle], %{text: "v1", property: :vehicle}) == [@vehicle]
    end

    test "doesn't match on ghost ID" do
      assert VehicleOrGhost.find_by([@ghost], %{text: "ghost", property: :vehicle}) == []
    end

    test "matches on operator name" do
      assert VehicleOrGhost.find_by(@vehicles, %{text: "frank", property: :operator}) ==
               [@vehicle]
    end

    test "matches on operator ID" do
      assert VehicleOrGhost.find_by(@vehicles, %{text: "710", property: :operator}) ==
               [@vehicle]
    end

    test "short circuits to an empty result if trying to match on the empty string" do
      assert VehicleOrGhost.find_by(@vehicles, %{text: "", property: :all}) == []
    end

    test "handles nil values" do
      ghost_with_nil_run_id = %{@ghost | run_id: nil}

      assert VehicleOrGhost.find_by([ghost_with_nil_run_id], %{text: "710", property: :all}) == []
    end
  end
end
