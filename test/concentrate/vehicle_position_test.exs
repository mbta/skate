defmodule Concentrate.VehiclePositionTest do
  use ExUnit.Case, async: true
  import Concentrate.VehiclePosition
  alias Concentrate.{DataDiscrepancy, Mergeable}

  describe "Concentrate.Mergeable" do
    test "merge/2 takes the latest of the two positions and notes discrepancies" do
      first =
        new(
          last_updated: 1,
          latitude: 1,
          longitude: 1,
          trip_id: "trip",
          route_id: "route",
          block_id: "block1",
          sources: MapSet.new(["first"])
        )

      second =
        new(
          last_updated: 2,
          latitude: 2,
          longitude: 2,
          block_id: "block2",
          sources: MapSet.new(["second"])
        )

      expected =
        new(
          last_updated: 2,
          last_updated_by_source: %{},
          latitude: 2,
          longitude: 2,
          trip_id: "trip",
          route_id: "route",
          block_id: "block2",
          sources: MapSet.new(["first", "second"]),
          data_discrepancies: [
            %DataDiscrepancy{
              attribute: :block_id,
              sources: [%{id: "first", value: "block1"}, %{id: "second", value: "block2"}]
            },
            %DataDiscrepancy{
              attribute: :trip_id,
              sources: [
                %{id: "first", value: "trip"},
                %{id: "second", value: nil}
              ]
            }
          ]
        )

      assert Mergeable.merge(first, second) == expected
      assert Mergeable.merge(second, first) == expected
    end

    test "merge/2 ignores the second if last_updated is nil" do
      first = new(last_updated: 1, latitude: 1, longitude: 1, trip_id: "trip")
      second = new(last_updated: nil, latitude: 2, longitude: 2)
      assert Mergeable.merge(first, second) == first
    end

    test "merge/2 ignores the first if last_updated is nil" do
      first = new(last_updated: nil, latitude: 1, longitude: 1, trip_id: "trip")
      second = new(last_updated: 2, latitude: 2, longitude: 2)
      assert Mergeable.merge(first, second) == second
    end

    test "merge/2 prioritizes the swiftly trip and route values if there is one" do
      swiftly =
        new(
          last_updated: 1,
          latitude: 1,
          longitude: 1,
          trip_id: "swiftly_trip",
          route_id: "swiftly_route",
          sources: MapSet.new(["swiftly"])
        )

      non_swiftly =
        new(
          last_updated: 2,
          latitude: 2,
          longitude: 2,
          trip_id: "busloc_trip",
          route_id: "busloc_route",
          sources: MapSet.new(["busloc"])
        )

      swiftly_later =
        new(
          last_updated: 3,
          latitude: 3,
          longitude: 3,
          trip_id: "swiftly_trip",
          route_id: "swiftly_route",
          sources: MapSet.new(["swiftly"])
        )

      expected =
        new(
          last_updated: 2,
          last_updated_by_source: %{},
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
        new(
          last_updated: 3,
          last_updated_by_source: %{},
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

      assert Mergeable.merge(swiftly, non_swiftly) == expected
      assert Mergeable.merge(non_swiftly, swiftly) == expected
      assert Mergeable.merge(swiftly_later, non_swiftly) == expected_later
      assert Mergeable.merge(non_swiftly, swiftly_later) == expected_later
    end

    test "merge/2 takes the other trip and route values if the swiftly values are nil" do
      swiftly =
        new(
          last_updated: 1,
          latitude: 1,
          longitude: 1,
          trip_id: nil,
          route_id: nil,
          sources: MapSet.new(["swiftly"])
        )

      non_swiftly =
        new(
          last_updated: 2,
          latitude: 2,
          longitude: 2,
          trip_id: "busloc_trip",
          route_id: "busloc_route",
          sources: MapSet.new(["busloc"])
        )

      expected =
        new(
          last_updated: 2,
          last_updated_by_source: %{},
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

      assert Mergeable.merge(swiftly, non_swiftly) == expected
      assert Mergeable.merge(non_swiftly, swiftly) == expected
    end

    test "merge/2 takes the overloaded block_id" do
      non_overloaded =
        new(
          last_updated: 1,
          block_id: "G89-5",
          latitude: 1,
          longitude: 1,
          sources: MapSet.new(["first"])
        )

      overloaded =
        new(
          last_updated: 1,
          block_id: "G89-5-OL1",
          latitude: 1,
          longitude: 1,
          sources: MapSet.new(["second"])
        )

      nil_block_id =
        new(
          last_updated: 1,
          block_id: nil,
          latitude: 1,
          longitude: 1,
          sources: MapSet.new(["third"])
        )

      assert Mergeable.merge(non_overloaded, overloaded) ==
               new(
                 last_updated: 1,
                 last_updated_by_source: %{},
                 block_id: "G89-5-OL1",
                 latitude: 1,
                 longitude: 1,
                 sources: MapSet.new(["first", "second"]),
                 data_discrepancies: [
                   %DataDiscrepancy{
                     attribute: :block_id,
                     sources: [
                       %{id: "first", value: "G89-5"},
                       %{id: "second", value: "G89-5-OL1"}
                     ]
                   }
                 ]
               )

      assert Mergeable.merge(overloaded, non_overloaded) ==
               new(
                 last_updated: 1,
                 last_updated_by_source: %{},
                 block_id: "G89-5-OL1",
                 latitude: 1,
                 longitude: 1,
                 sources: MapSet.new(["first", "second"]),
                 data_discrepancies: [
                   %DataDiscrepancy{
                     attribute: :block_id,
                     sources: [
                       %{id: "second", value: "G89-5-OL1"},
                       %{id: "first", value: "G89-5"}
                     ]
                   }
                 ]
               )

      assert Mergeable.merge(nil_block_id, overloaded) ==
               new(
                 last_updated: 1,
                 last_updated_by_source: %{},
                 block_id: "G89-5-OL1",
                 latitude: 1,
                 longitude: 1,
                 sources: MapSet.new(["second", "third"]),
                 data_discrepancies: [
                   %DataDiscrepancy{
                     attribute: :block_id,
                     sources: [
                       %{id: "third", value: nil},
                       %{id: "second", value: "G89-5-OL1"}
                     ]
                   }
                 ]
               )

      assert Mergeable.merge(overloaded, nil_block_id) ==
               new(
                 last_updated: 1,
                 last_updated_by_source: %{},
                 block_id: "G89-5-OL1",
                 latitude: 1,
                 longitude: 1,
                 sources: MapSet.new(["second", "third"]),
                 data_discrepancies: [
                   %DataDiscrepancy{
                     attribute: :block_id,
                     sources: [
                       %{id: "second", value: "G89-5-OL1"},
                       %{id: "third", value: nil}
                     ]
                   }
                 ]
               )
    end

    test "merge/2 doesn't include any data discrepancies if they values are the same" do
      first =
        new(
          last_updated: 1,
          latitude: 1,
          longitude: 1,
          trip_id: "trip",
          route_id: "route",
          sources: MapSet.new(["first"])
        )

      second =
        new(
          last_updated: 2,
          latitude: 2,
          longitude: 2,
          trip_id: "trip",
          route_id: "route",
          sources: MapSet.new(["second"])
        )

      expected =
        new(
          last_updated: 2,
          last_updated_by_source: %{},
          latitude: 2,
          longitude: 2,
          trip_id: "trip",
          route_id: "route",
          sources: MapSet.new(["first", "second"]),
          data_discrepancies: []
        )

      assert Mergeable.merge(first, second) == expected
    end

    test "merge/2 retains all timestamps" do
      first =
        new(
          last_updated: 1,
          latitude: 1,
          longitude: 1,
          trip_id: "trip",
          route_id: "route",
          sources: MapSet.new(["first"])
        )

      second =
        new(
          last_updated: 2,
          latitude: 1,
          longitude: 1,
          trip_id: "trip",
          route_id: "route",
          sources: MapSet.new(["second"])
        )

      expected =
        new(
          last_updated: 2,
          last_updated_by_source: %{},
          latitude: 1,
          longitude: 1,
          trip_id: "trip",
          route_id: "route",
          sources: MapSet.new(["first", "second"]),
          data_discrepancies: []
        )

      assert Mergeable.merge(first, second) == expected
    end
  end

  describe "comes_from_swiftly?/1" do
    test "true if sources include swiftly" do
      vp =
        new(
          last_updated: 1,
          latitude: 1,
          longitude: 1,
          sources: MapSet.new(["busloc", "swiftly"])
        )

      assert comes_from_swiftly?(vp)
    end

    test "false if sources don't include swiftly" do
      vp =
        new(
          last_updated: 1,
          latitude: 1,
          longitude: 1,
          sources: MapSet.new(["busloc"])
        )

      refute comes_from_swiftly?(vp)
    end

    test "false if there are no sources" do
      vp =
        new(
          last_updated: 1,
          latitude: 1,
          longitude: 1
        )

      refute comes_from_swiftly?(vp)
    end
  end
end
