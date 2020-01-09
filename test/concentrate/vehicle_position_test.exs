defmodule Concentrate.VehiclePositionTest do
  use ExUnit.Case, async: true
  alias Concentrate.VehiclePosition
  alias Concentrate.{DataDiscrepancy}

  describe "merge/2" do
    test "merge/2 takes the latest of the two positions and notes discrepancies" do
      first =
        VehiclePosition.new(
          last_updated: 1,
          latitude: 1,
          longitude: 1,
          trip_id: "trip",
          route_id: "route",
          sources: MapSet.new(["first"])
        )

      second =
        VehiclePosition.new(
          last_updated: 2,
          latitude: 2,
          longitude: 2,
          sources: MapSet.new(["second"])
        )

      expected =
        VehiclePosition.new(
          last_updated: 2,
          latitude: 2,
          longitude: 2,
          trip_id: "trip",
          route_id: "route",
          sources: MapSet.new(["first", "second"]),
          data_discrepancies: [
            %DataDiscrepancy{
              attribute: :trip_id,
              sources: [
                %{id: "first", value: "trip"},
                %{id: "second", value: nil}
              ]
            }
          ]
        )

      assert VehiclePosition.merge(first, second) == expected
      assert VehiclePosition.merge(second, first) == expected
    end

    test "merge/2 ignores the second if last_updated is nil" do
      first = VehiclePosition.new(last_updated: 1, latitude: 1, longitude: 1, trip_id: "trip")
      second = VehiclePosition.new(last_updated: nil, latitude: 2, longitude: 2)
      assert VehiclePosition.merge(first, second) == first
    end

    test "merge/2 ignores the first if last_updated is nil" do
      first = VehiclePosition.new(last_updated: nil, latitude: 1, longitude: 1, trip_id: "trip")
      second = VehiclePosition.new(last_updated: 2, latitude: 2, longitude: 2)
      assert VehiclePosition.merge(first, second) == second
    end

    test "merge/2 prioritizes the swiftly trip and route values if there is one" do
      swiftly =
        VehiclePosition.new(
          last_updated: 1,
          latitude: 1,
          longitude: 1,
          trip_id: "swiftly_trip",
          route_id: "swiftly_route",
          sources: MapSet.new(["swiftly"])
        )

      non_swiftly =
        VehiclePosition.new(
          last_updated: 2,
          latitude: 2,
          longitude: 2,
          trip_id: "busloc_trip",
          route_id: "busloc_route",
          sources: MapSet.new(["busloc"])
        )

      swiftly_later =
        VehiclePosition.new(
          last_updated: 3,
          latitude: 3,
          longitude: 3,
          trip_id: "swiftly_trip",
          route_id: "swiftly_route",
          sources: MapSet.new(["swiftly"])
        )

      expected =
        VehiclePosition.new(
          last_updated: 2,
          latitude: 2,
          longitude: 2,
          trip_id: "swiftly_trip",
          route_id: "swiftly_route",
          sources: MapSet.new(["busloc", "swiftly"]),
          data_discrepancies: [
            %DataDiscrepancy{
              attribute: :trip_id,
              sources: [
                %{id: "swiftly", value: "swiftly_trip"},
                %{id: "busloc", value: "busloc_trip"}
              ]
            }
          ]
        )

      expected_later =
        VehiclePosition.new(
          last_updated: 3,
          latitude: 3,
          longitude: 3,
          trip_id: "swiftly_trip",
          route_id: "swiftly_route",
          sources: MapSet.new(["busloc", "swiftly"]),
          data_discrepancies: [
            %DataDiscrepancy{
              attribute: :trip_id,
              sources: [
                %{id: "busloc", value: "busloc_trip"},
                %{id: "swiftly", value: "swiftly_trip"}
              ]
            }
          ]
        )

      assert VehiclePosition.merge(swiftly, non_swiftly) == expected
      assert VehiclePosition.merge(non_swiftly, swiftly) == expected
      assert VehiclePosition.merge(swiftly_later, non_swiftly) == expected_later
      assert VehiclePosition.merge(non_swiftly, swiftly_later) == expected_later
    end

    test "merge/2 takes the other trip and route values if the swiftly values are nil" do
      swiftly =
        VehiclePosition.new(
          last_updated: 1,
          latitude: 1,
          longitude: 1,
          trip_id: nil,
          route_id: nil,
          sources: MapSet.new(["swiftly"])
        )

      non_swiftly =
        VehiclePosition.new(
          last_updated: 2,
          latitude: 2,
          longitude: 2,
          trip_id: "busloc_trip",
          route_id: "busloc_route",
          sources: MapSet.new(["busloc"])
        )

      expected =
        VehiclePosition.new(
          last_updated: 2,
          latitude: 2,
          longitude: 2,
          trip_id: "busloc_trip",
          route_id: "busloc_route",
          sources: MapSet.new(["busloc", "swiftly"]),
          data_discrepancies: [
            %DataDiscrepancy{
              attribute: :trip_id,
              sources: [
                %{id: "swiftly", value: nil},
                %{id: "busloc", value: "busloc_trip"}
              ]
            }
          ]
        )

      assert VehiclePosition.merge(swiftly, non_swiftly) == expected
      assert VehiclePosition.merge(non_swiftly, swiftly) == expected
    end

    test "merge/2 doesn't include any data discrepancies if they values are the same" do
      first =
        VehiclePosition.new(
          last_updated: 1,
          latitude: 1,
          longitude: 1,
          trip_id: "trip",
          route_id: "route",
          sources: MapSet.new(["first"])
        )

      second =
        VehiclePosition.new(
          last_updated: 2,
          latitude: 2,
          longitude: 2,
          trip_id: "trip",
          route_id: "route",
          sources: MapSet.new(["second"])
        )

      expected =
        VehiclePosition.new(
          last_updated: 2,
          latitude: 2,
          longitude: 2,
          trip_id: "trip",
          route_id: "route",
          sources: MapSet.new(["first", "second"]),
          data_discrepancies: []
        )

      assert VehiclePosition.merge(first, second) == expected
    end
  end

  describe "comes_from_swiftly?/1" do
    test "true if sources include swiftly" do
      vp =
        VehiclePosition.new(
          last_updated: 1,
          latitude: 1,
          longitude: 1,
          sources: MapSet.new(["busloc", "swiftly"])
        )

      assert VehiclePosition.comes_from_swiftly?(vp)
    end

    test "false if sources don't include swiftly" do
      vp =
        VehiclePosition.new(
          last_updated: 1,
          latitude: 1,
          longitude: 1,
          sources: MapSet.new(["busloc"])
        )

      refute VehiclePosition.comes_from_swiftly?(vp)
    end

    test "false if there are no sources" do
      vp =
        VehiclePosition.new(
          last_updated: 1,
          latitude: 1,
          longitude: 1
        )

      refute VehiclePosition.comes_from_swiftly?(vp)
    end
  end
end
