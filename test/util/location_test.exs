defmodule Util.LocationTest do
  use ExUnit.Case, async: true

  alias Util.Location

  doctest Util.Location

  defmodule SampleLoc do
    defstruct [:lat, :long]

    defimpl Location.From, for: __MODULE__ do
      def as_location(%SampleLoc{lat: lat, long: long}) do
        {:ok, Location.new(lat, long)}
      end
    end
  end

  describe "distance/2" do
    test "works for Location structs" do
      assert_in_delta(
        Location.distance(Location.new(42, -71.0001), Location.new(42, -71.0002)),
        8.263,
        0.001
      )
    end

    test "works for things that implement Location.From" do
      assert_in_delta(
        Location.distance(%SampleLoc{lat: 42, long: -71.0001}, %SampleLoc{lat: 42, long: -71.0002}),
        8.263,
        0.001
      )
    end
  end

  describe "distance_from_segment/2" do
    test "for a horizontal segment, works when the closest_point is near the middle of the segment" do
      %{
        closest_point: %{latitude: closest_latitude, longitude: closest_longitude},
        distance: distance
      } =
        Location.distance_from_segment(
          Location.new(42.0001, -71.00013),
          {Location.new(42, -71.0002), Location.new(42, -71.0001)}
        )

      assert_in_delta closest_latitude, 42, 0.000001
      assert_in_delta closest_longitude, -71.00013, 0.000001
      assert_in_delta distance, 11.119, 0.001
    end

    test "for a horizontal segment, works when the closest_point is 'off' the segment closer to the start point" do
      %{
        closest_point: %{latitude: closest_latitude, longitude: closest_longitude},
        distance: distance
      } =
        Location.distance_from_segment(
          Location.new(42.0001, -71.00022),
          {Location.new(42, -71.0002), Location.new(42, -71.0001)}
        )

      assert_in_delta closest_latitude, 42, 0.000001
      assert_in_delta closest_longitude, -71.0002, 0.000001
      assert_in_delta distance, 11.242, 0.001
    end

    test "for a horizontal segment, works when the closest_point is 'off' the segment closer to the end point" do
      %{
        closest_point: %{latitude: closest_latitude, longitude: closest_longitude},
        distance: distance
      } =
        Location.distance_from_segment(
          Location.new(42.0001, -71.00008),
          {Location.new(42, -71.0002), Location.new(42, -71.0001)}
        )

      assert_in_delta closest_latitude, 42, 0.000001
      assert_in_delta closest_longitude, -71.0001, 0.000001
      assert_in_delta distance, 11.242, 0.001
    end

    test "for a vertical segment, works when the closest_point is near the middle of the segment" do
      %{
        closest_point: %{latitude: closest_latitude, longitude: closest_longitude},
        distance: distance
      } =
        Location.distance_from_segment(
          Location.new(42.00004, -71.0003),
          {Location.new(42, -71.0002), Location.new(42.0001, -71.0002)}
        )

      assert_in_delta closest_latitude, 42.00004, 0.000001
      assert_in_delta closest_longitude, -71.0002, 0.000001
      assert_in_delta distance, 8.263, 0.001
    end

    test "works for a diagonal segment" do
      %{
        closest_point: %{latitude: closest_latitude, longitude: closest_longitude},
        distance: distance
      } =
        Location.distance_from_segment(
          Location.new(42.00004, -71.00014),
          {Location.new(42, -71.0002), Location.new(42.0001, -71.0001)}
        )

      assert_in_delta closest_latitude, 42.000047, 0.000001
      assert_in_delta closest_longitude, -71.000153, 0.000001
      assert_in_delta distance, 1.326, 0.001
    end
  end
end
