defmodule Concentrate.TripUpdateTest do
  use ExUnit.Case, async: true
  import Concentrate.TripUpdate
  alias Concentrate.Mergeable

  describe "Concentrate.Mergeable" do
    test "merge/2 takes non-nil values" do
      first =
        new(
          trip_id: "trip",
          route_id: "route",
          start_date: ~D[2017-12-20]
        )

      second =
        new(
          trip_id: "trip",
          direction_id: 0,
          start_time: ~T[12:00:00],
          schedule_relationship: :ADDED
        )

      expected =
        new(
          trip_id: "trip",
          route_id: "route",
          direction_id: 0,
          start_date: ~D[2017-12-20],
          start_time: ~T[12:00:00],
          schedule_relationship: :ADDED
        )

      assert Mergeable.merge(first, second) == expected
      assert Mergeable.merge(second, first) == expected
    end
  end

  describe "cancel/1" do
    test "returns a TripUpdate with schedule_relationship set to :CANCELED" do
      initial =
        new(
          trip_id: "trip",
          direction_id: 0,
          start_time: ~T[12:00:00],
          schedule_relationship: :ADDED
        )

      expected =
        new(
          trip_id: "trip",
          direction_id: 0,
          start_time: ~T[12:00:00],
          schedule_relationship: :CANCELED
        )

      assert cancel(initial) == expected
    end
  end
end
