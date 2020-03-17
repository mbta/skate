defmodule Realtime.StopTimeUpdatesByTripTest do
  use ExUnit.Case, async: true

  alias Concentrate.StopTimeUpdate
  alias Realtime.StopTimeUpdatesByTrip

  @stop_time_updates [
    StopTimeUpdate.new(
      trip_id: "trip1",
      stop_id: "stop1",
      stop_sequence: 1,
      arrival_time: 1,
      departure_time: 4,
      status: "status",
      track: "track",
      schedule_relationship: :SKIPPED,
      platform_id: "platform",
      uncertainty: 300,
      remark: "B"
    )
  ]
  @stop_time_updates_by_trip %{
    "trip1" => @stop_time_updates
  }

  describe "stop_time_updates_for_trip/2" do
    test "get the StopTimeUpdates for the requested trip ID" do
      assert StopTimeUpdatesByTrip.stop_time_updates_for_trip(@stop_time_updates_by_trip, "trip1") ==
               @stop_time_updates
    end

    test "returns an empty list if there are no updates for this trip" do
      assert StopTimeUpdatesByTrip.stop_time_updates_for_trip(
               @stop_time_updates_by_trip,
               "missing"
             ) ==
               []
    end
  end

  describe "trip_ids/1" do
    test "returns a list of trips with stop time updates" do
      assert StopTimeUpdatesByTrip.trip_ids(@stop_time_updates_by_trip) == ["trip1"]
    end
  end
end
