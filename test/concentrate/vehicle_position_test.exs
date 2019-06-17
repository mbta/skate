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
          source: "first"
        )

      second = new(last_updated: 2, latitude: 2, longitude: 2, source: "second")

      expected =
        new(
          last_updated: 2,
          latitude: 2,
          longitude: 2,
          trip_id: "trip",
          route_id: "route",
          source: "first|second",
          data_discrepancies: [
            %DataDiscrepancy{
              attribute: :trip_id,
              sources: [
                %{id: "first", value: "trip"},
                %{id: "second", value: nil}
              ]
            },
            %DataDiscrepancy{
              attribute: :route_id,
              sources: [
                %{id: "first", value: "route"},
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
          source: "swiftly"
        )

      non_swiftly =
        new(
          last_updated: 2,
          latitude: 2,
          longitude: 2,
          trip_id: "busloc_trip",
          route_id: "busloc_route",
          source: "busloc"
        )

      swiftly_later =
        new(
          last_updated: 3,
          latitude: 3,
          longitude: 3,
          trip_id: "swiftly_trip",
          route_id: "swiftly_route",
          source: "swiftly"
        )

      expected =
        new(
          last_updated: 2,
          latitude: 2,
          longitude: 2,
          trip_id: "swiftly_trip",
          route_id: "swiftly_route",
          source: "busloc|swiftly",
          data_discrepancies: [
            %DataDiscrepancy{
              attribute: :trip_id,
              sources: [
                %{id: "swiftly", value: "swiftly_trip"},
                %{id: "busloc", value: "busloc_trip"}
              ]
            },
            %DataDiscrepancy{
              attribute: :route_id,
              sources: [
                %{id: "swiftly", value: "swiftly_route"},
                %{id: "busloc", value: "busloc_route"}
              ]
            }
          ]
        )

      expected_later =
        new(
          last_updated: 3,
          latitude: 3,
          longitude: 3,
          trip_id: "swiftly_trip",
          route_id: "swiftly_route",
          source: "busloc|swiftly",
          data_discrepancies: [
            %DataDiscrepancy{
              attribute: :trip_id,
              sources: [
                %{id: "busloc", value: "busloc_trip"},
                %{id: "swiftly", value: "swiftly_trip"}
              ]
            },
            %DataDiscrepancy{
              attribute: :route_id,
              sources: [
                %{id: "busloc", value: "busloc_route"},
                %{id: "swiftly", value: "swiftly_route"}
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
          source: "swiftly"
        )

      non_swiftly =
        new(
          last_updated: 2,
          latitude: 2,
          longitude: 2,
          trip_id: "busloc_trip",
          route_id: "busloc_route",
          source: "busloc"
        )

      expected =
        new(
          last_updated: 2,
          latitude: 2,
          longitude: 2,
          trip_id: "busloc_trip",
          route_id: "busloc_route",
          source: "busloc|swiftly",
          data_discrepancies: [
            %DataDiscrepancy{
              attribute: :trip_id,
              sources: [
                %{id: "swiftly", value: nil},
                %{id: "busloc", value: "busloc_trip"}
              ]
            },
            %DataDiscrepancy{
              attribute: :route_id,
              sources: [
                %{id: "swiftly", value: nil},
                %{id: "busloc", value: "busloc_route"}
              ]
            }
          ]
        )

      assert Mergeable.merge(swiftly, non_swiftly) == expected
      assert Mergeable.merge(non_swiftly, swiftly) == expected
    end

    test "merge/2 defaults to the latest value if both come from swiftly" do
      swiftly =
        new(
          last_updated: 1,
          latitude: 1,
          longitude: 1,
          trip_id: "swiftly_trip",
          route_id: "swiftly_route",
          source: "swiftly"
        )

      swiftly_merged =
        new(
          last_updated: 2,
          latitude: 2,
          longitude: 2,
          trip_id: "swiftly_merged_trip",
          route_id: "swiftly_merged_route",
          source: "busloc|swiftly"
        )

      expected =
        new(
          last_updated: 2,
          latitude: 2,
          longitude: 2,
          trip_id: "swiftly_merged_trip",
          route_id: "swiftly_merged_route",
          source: "busloc|swiftly",
          data_discrepancies: [
            %DataDiscrepancy{
              attribute: :trip_id,
              sources: [
                %{id: "swiftly", value: "swiftly_trip"},
                %{id: "busloc|swiftly", value: "swiftly_merged_trip"}
              ]
            },
            %DataDiscrepancy{
              attribute: :route_id,
              sources: [
                %{id: "swiftly", value: "swiftly_route"},
                %{id: "busloc|swiftly", value: "swiftly_merged_route"}
              ]
            }
          ]
        )

      assert Mergeable.merge(swiftly_merged, swiftly) == expected
      assert Mergeable.merge(swiftly, swiftly_merged) == expected
    end

    test "merge/2 doesn't include any data discrepancies if they values are the same" do
      first =
        new(
          last_updated: 1,
          latitude: 1,
          longitude: 1,
          trip_id: "trip",
          route_id: "route",
          source: "first"
        )

      second =
        new(
          last_updated: 2,
          latitude: 2,
          longitude: 2,
          trip_id: "trip",
          route_id: "route",
          source: "second"
        )

      expected =
        new(
          last_updated: 2,
          latitude: 2,
          longitude: 2,
          trip_id: "trip",
          route_id: "route",
          source: "first|second",
          data_discrepancies: []
        )

      assert Mergeable.merge(first, second) == expected
    end
  end

  describe "sources/1" do
    test "returns a single source in a list" do
      vp =
        new(
          last_updated: 1,
          latitude: 1,
          longitude: 1,
          source: "swiftly"
        )

      assert sources(vp) == ["swiftly"]
    end

    test "returns merged sources separated out" do
      vp =
        new(
          last_updated: 1,
          latitude: 1,
          longitude: 1,
          source: "busloc|swiftly"
        )

      assert sources(vp) == ["busloc", "swiftly"]
    end

    test "returns an empty array for a nil source" do
      vp =
        new(
          last_updated: 1,
          latitude: 1,
          longitude: 1,
          source: nil
        )

      assert sources(vp) == []
    end
  end

  describe "comes_from_swiftly/1" do
    test "true if the source string is swiftly" do
      vp =
        new(
          last_updated: 1,
          latitude: 1,
          longitude: 1,
          source: "swiftly"
        )

      assert comes_from_swiftly(vp)
    end

    test "true if source string is a merged value that includes swiftly" do
      vp =
        new(
          last_updated: 1,
          latitude: 1,
          longitude: 1,
          source: "busloc|swiftly"
        )

      assert comes_from_swiftly(vp)
    end

    test "false if source string doesn't include swiftly" do
      vp =
        new(
          last_updated: 1,
          latitude: 1,
          longitude: 1,
          source: "busloc"
        )

      refute comes_from_swiftly(vp)
    end
  end
end
