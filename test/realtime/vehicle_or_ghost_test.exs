defmodule Realtime.VehicleOrGhostTest do
  use ExUnit.Case, async: true

  import Skate.Factory

  alias Realtime.{Ghost, Vehicle, VehicleOrGhost}

  @operator_last_name build(:last_name)

  @vehicle %Vehicle{
    id: "vehicle1",
    label: "v1-label",
    timestamp: 1_558_121_727,
    timestamp_by_source: %{"swiftly" => 1_558_121_727},
    latitude: 42.3408556,
    longitude: -71.0642766,
    direction_id: 0,
    route_id: "vehicle-route-1",
    trip_id: "vehicle-trip-1",
    bearing: nil,
    block_id: "A505-106",
    operator_id: build(:operator_id),
    operator_first_name: build(:first_name),
    operator_last_name: @operator_last_name,
    operator_name: @operator_last_name,
    operator_logon_time: 1_558_121_726,
    overload_offset: nil,
    run_id: "vehicle-run-1",
    is_shuttle: false,
    is_overload: false,
    is_off_course: false,
    is_revenue: true,
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
      vehicle = @vehicle
      vehicles = [vehicle, @ghost]

      assert VehicleOrGhost.find_by(vehicles, %{text: "vehicle-run-1", property: :all}) ==
               [vehicle]

      assert VehicleOrGhost.find_by(vehicles, %{text: "vehicle-run v1-la", property: :all}) ==
               [vehicle]

      assert VehicleOrGhost.find_by(vehicles, %{text: "ghost", property: :all}) ==
               [@ghost]

      assert VehicleOrGhost.find_by(vehicles, %{text: vehicle.operator_last_name, property: :all}) ==
               [vehicle]

      assert VehicleOrGhost.find_by(vehicles, %{
               text: String.slice(vehicle.operator_last_name, 0..-3),
               property: :all
             }) ==
               [vehicle]

      assert VehicleOrGhost.find_by(vehicles, %{text: vehicle.operator_first_name, property: :all}) ==
               [vehicle]

      assert VehicleOrGhost.find_by(vehicles, %{
               text: String.slice(vehicle.operator_first_name, 0..-3),
               property: :all
             }) ==
               [vehicle]

      assert VehicleOrGhost.find_by(vehicles, %{
               text: "#{vehicle.operator_first_name} #{vehicle.operator_last_name}",
               property: :all
             }) ==
               [vehicle]

      assert VehicleOrGhost.find_by(vehicles, %{
               text: "#{vehicle.operator_last_name}, #{vehicle.operator_first_name}",
               property: :all
             }) ==
               [vehicle]

      assert VehicleOrGhost.find_by(vehicles, %{text: vehicle.operator_id, property: :all}) ==
               [vehicle]
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
      assert VehicleOrGhost.find_by(@vehicles, %{
               text: String.slice(@vehicle.operator_last_name, 0..-3),
               property: :operator
             }) ==
               [@vehicle]
    end

    test "matches on operator ID" do
      vehicle = @vehicle
      vehicles = [vehicle, @ghost]

      assert VehicleOrGhost.find_by(vehicles, %{text: vehicle.operator_id, property: :operator}) ==
               [vehicle]
    end

    test "short circuits to an empty result if trying to match on the empty string" do
      assert VehicleOrGhost.find_by(@vehicles, %{text: "", property: :all}) == []
    end

    test "handles nil values" do
      ghost_with_nil_run_id = %{@ghost | run_id: nil}

      assert VehicleOrGhost.find_by([ghost_with_nil_run_id], %{text: "710", property: :all}) == []
    end
  end

  describe "take_limited_matches/2" do
    test "when given a limit, takes only the limited number of matches" do
      match_1 = build(:vehicle, %{label: "0001"})
      other_1 = build(:vehicle, %{label: "not_match_1"})
      match_2 = build(:vehicle, %{label: "0002"})
      other_2 = build(:vehicle, %{label: "not_match_2"})
      match_3 = build(:vehicle, %{label: "0003"})

      assert %{matching_vehicles: [match_1, match_2], has_more_matches: true} ==
               VehicleOrGhost.take_limited_matches(
                 [match_1, other_1, match_2, other_2, match_3],
                 %{
                   text: "000",
                   property: :vehicle,
                   limit: 2
                 }
               )
    end

    test "when limit exceeds number of matches, returns all matches" do
      match_1 = build(:vehicle, %{label: "0001"})
      other_1 = build(:vehicle, %{label: "not_match_1"})
      match_2 = build(:vehicle, %{label: "0002"})
      other_2 = build(:vehicle, %{label: "not_match_2"})
      match_3 = build(:vehicle, %{label: "0003"})

      assert %{matching_vehicles: [match_1, match_2, match_3], has_more_matches: false} ==
               VehicleOrGhost.take_limited_matches(
                 [match_1, other_1, match_2, other_2, match_3],
                 %{
                   text: "000",
                   property: :vehicle,
                   limit: 5
                 }
               )
    end

    test "puts results in correct order" do
      vehicle1 = build(:vehicle, %{operator_logon_time: 100, run_id: "123-1000"})
      vehicle2 = build(:vehicle, %{operator_logon_time: 200, run_id: "123-2000"})
      vehicle3 = build(:vehicle, %{operator_logon_time: 300, run_id: "123-3000"})
      ghost = build(:ghost, %{run_id: "123-4000"})
      logged_out_vehicle = build(:vehicle, %{operator_logon_time: nil, label: "1000"})

      assert %{
               matching_vehicles: [^ghost, ^vehicle3, ^vehicle2, ^vehicle1, ^logged_out_vehicle],
               has_more_matches: false
             } =
               VehicleOrGhost.take_limited_matches(
                 [
                   vehicle2,
                   vehicle3,
                   ghost,
                   logged_out_vehicle,
                   vehicle1
                 ],
                 %{text: "000", property: :all, limit: 5}
               )
    end
  end
end
