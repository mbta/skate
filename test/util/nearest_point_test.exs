defmodule Util.NearestPointTest do
  use ExUnit.Case, async: true

  alias Util.Location
  alias Util.NearestPoint

  doctest Util.NearestPoint

  defmodule SampleLoc do
    defstruct [:lat, :long]

    defimpl Location.From, for: __MODULE__ do
      def as_location(%SampleLoc{lat: lat, long: long}) do
        {:ok, Location.new(lat, long)}
      end
    end
  end

  describe "nearest_point_on_segment/2" do
    test "for a horizontal segment, works when the closest_point is near the middle of the segment" do
      %{latitude: closest_latitude, longitude: closest_longitude} =
        NearestPoint.nearest_point_on_segment(
          Location.new(42.0001, -71.00013),
          {Location.new(42, -71.0002), Location.new(42, -71.0001)}
        )

      assert_in_delta closest_latitude, 42, 0.000001
      assert_in_delta closest_longitude, -71.00013, 0.000001
    end

    test "for a horizontal segment, works when the closest_point is 'off' the segment closer to the start point" do
      %{latitude: closest_latitude, longitude: closest_longitude} =
        NearestPoint.nearest_point_on_segment(
          Location.new(42.0001, -71.00022),
          {Location.new(42, -71.0002), Location.new(42, -71.0001)}
        )

      assert_in_delta closest_latitude, 42, 0.000001
      assert_in_delta closest_longitude, -71.0002, 0.000001
    end

    test "for a horizontal segment, works when the closest_point is 'off' the segment closer to the end point" do
      %{latitude: closest_latitude, longitude: closest_longitude} =
        NearestPoint.nearest_point_on_segment(
          Location.new(42.0001, -71.00008),
          {Location.new(42, -71.0002), Location.new(42, -71.0001)}
        )

      assert_in_delta closest_latitude, 42, 0.000001
      assert_in_delta closest_longitude, -71.0001, 0.000001
    end

    test "for a vertical segment, works when the closest_point is near the middle of the segment" do
      %{latitude: closest_latitude, longitude: closest_longitude} =
        NearestPoint.nearest_point_on_segment(
          Location.new(42.00004, -71.0003),
          {Location.new(42, -71.0002), Location.new(42.0001, -71.0002)}
        )

      assert_in_delta closest_latitude, 42.00004, 0.000001
      assert_in_delta closest_longitude, -71.0002, 0.000001
    end

    test "works for a diagonal segment" do
      %{latitude: closest_latitude, longitude: closest_longitude} =
        NearestPoint.nearest_point_on_segment(
          Location.new(42.00004, -71.00014),
          {Location.new(42, -71.0002), Location.new(42.0001, -71.0001)}
        )

      assert_in_delta closest_latitude, 42.000047, 0.000001
      assert_in_delta closest_longitude, -71.000153, 0.000001
    end

    test "works for a zero-length segment" do
      %{latitude: closest_latitude, longitude: closest_longitude} =
        NearestPoint.nearest_point_on_segment(
          Location.new(42.0001, -71.00008),
          {Location.new(42, -71.0001), Location.new(42, -71.0001)}
        )

      assert_in_delta closest_latitude, 42, 0.000001
      assert_in_delta closest_longitude, -71.0001, 0.000001
    end

    test "allows point and segments to be things that implement Location.From" do
      %{latitude: closest_latitude, longitude: closest_longitude} =
        NearestPoint.nearest_point_on_segment(
          %SampleLoc{lat: 42.0001, long: -71.00013},
          {%SampleLoc{lat: 42, long: -71.0002}, %SampleLoc{lat: 42, long: -71.0001}}
        )

      assert_in_delta closest_latitude, 42, 0.000001
      assert_in_delta closest_longitude, -71.00013, 0.000001
    end
  end
end
