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
end
