defmodule Concentrate.StopTimeUpdateTest do
  use ExUnit.Case

  alias Concentrate.{Mergeable, StopTimeUpdate}
  alias Gtfs.Stop

  describe "Concentrate.Mergeable" do
    test "key/1 uses the parent station ID" do
      stop_fn = fn stop_id ->
        case stop_id do
          "child_id" ->
            %Stop{
              id: "child_id",
              name: "stop name",
              parent_station_id: "parent_id"
            }

          "other" ->
            %Stop{
              id: "other",
              name: "other stop",
              parent_station_id: nil
            }

          nil ->
            nil
        end
      end

      assert Mergeable.key(StopTimeUpdate.new(stop_id: "child_id"), stop_fn: stop_fn) ==
               {nil, "parent_id", nil}

      assert Mergeable.key(StopTimeUpdate.new(stop_id: "other"), stop_fn: stop_fn) ==
               {nil, "other", nil}

      assert Mergeable.key(StopTimeUpdate.new(stop_id: nil), stop_fn: stop_fn) == {nil, nil, nil}
    end

    test "merge/2 takes non-nil values, earliest arrival, latest departure" do
      first =
        StopTimeUpdate.new(
          trip_id: "trip",
          stop_id: "stop",
          stop_sequence: 1,
          arrival_time: 2,
          departure_time: 3,
          status: "status",
          platform_id: "platform"
        )

      second =
        StopTimeUpdate.new(
          trip_id: "trip",
          stop_id: "stop-01",
          stop_sequence: 1,
          arrival_time: 1,
          departure_time: 4,
          track: "track",
          schedule_relationship: :SKIPPED,
          uncertainty: 300
        )

      expected =
        StopTimeUpdate.new(
          trip_id: "trip",
          stop_id: "stop-01",
          stop_sequence: 1,
          arrival_time: 1,
          departure_time: 4,
          status: "status",
          track: "track",
          schedule_relationship: :SKIPPED,
          platform_id: "platform",
          uncertainty: 300
        )

      assert Mergeable.merge(first, second) == expected
      assert Mergeable.merge(second, first) == expected
    end

    test "merge/2 takes the non-nil arrival/departure time if the one is nil" do
      first =
        StopTimeUpdate.new(
          trip_id: "trip",
          stop_id: "stop",
          arrival_time: nil
        )

      second =
        StopTimeUpdate.new(
          trip_id: "trip",
          stop_id: "stop-01",
          arrival_time: 1
        )

      expected =
        StopTimeUpdate.new(
          trip_id: "trip",
          stop_id: "stop-01",
          arrival_time: 1
        )

      assert Mergeable.merge(first, second) == expected
      assert Mergeable.merge(second, first) == expected
    end

    test "merge/2 takes the arrival/departure time if both are the same" do
      first =
        StopTimeUpdate.new(
          trip_id: "trip",
          stop_id: "stop",
          arrival_time: 1
        )

      second =
        StopTimeUpdate.new(
          trip_id: "trip",
          stop_id: "stop-01",
          arrival_time: 1
        )

      expected =
        StopTimeUpdate.new(
          trip_id: "trip",
          stop_id: "stop-01",
          arrival_time: 1
        )

      assert Mergeable.merge(first, second) == expected
      assert Mergeable.merge(second, first) == expected
    end
  end

  describe "time/1" do
    test "returns arrival time if present" do
      stop_time_update =
        StopTimeUpdate.new(
          arrival_time: 123,
          departure_time: 456
        )

      assert StopTimeUpdate.time(stop_time_update) == 123
    end

    test "returns departure time if arrival time is not present" do
      stop_time_update = StopTimeUpdate.new(departure_time: 456)

      assert StopTimeUpdate.time(stop_time_update) == 456
    end
  end

  describe "skip/1" do
    test "returns a StopTimeUpdate with schedule_relationship set to :SKIPPED and the arrival_time and departure_time cleared" do
      initial =
        StopTimeUpdate.new(
          schedule_relationship: :ADDED,
          arrival_time: 123,
          departure_time: 456
        )

      expected =
        StopTimeUpdate.new(
          schedule_relationship: :SKIPPED,
          arrival_time: nil,
          departure_time: nil
        )

      assert StopTimeUpdate.skip(initial) == expected
    end
  end
end
