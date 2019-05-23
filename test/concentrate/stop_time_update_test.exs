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
              parent_station_id: "parent_id"
            }

          "other" ->
            %Stop{
              id: "other",
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
  end
end
