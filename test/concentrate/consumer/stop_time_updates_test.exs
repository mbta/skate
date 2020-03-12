defmodule Concentrate.Supervisor.StopTimeUpdatesTest do
  @moduledoc false
  use ExUnit.Case, async: true
  import Test.Support.Helpers

  alias Concentrate.{StopTimeUpdate, TripUpdate}
  alias Concentrate.Consumer.StopTimeUpdates
  alias Gtfs.Trip

  @trip %Trip{
    id: "t1",
    route_id: "28",
    service_id: "service",
    headsign: "headsign",
    direction_id: 1,
    block_id: "S28-2",
    route_pattern_id: "28-_-0",
    shape_id: "shape1",
    run_id: "run1",
    stop_times: []
  }

  @stop_time_update %StopTimeUpdate{
    arrival_time: nil,
    departure_time: nil,
    platform_id: nil,
    remark: nil,
    schedule_relationship: :SKIPPED,
    status: nil,
    stop_id: "s1",
    stop_sequence: nil,
    track: nil,
    trip_id: "t1",
    uncertainty: nil
  }

  @all_updates [
    %TripUpdate{
      direction_id: nil,
      remark: nil,
      route_id: "r1",
      schedule_relationship: :SCHEDULED,
      start_date: nil,
      start_time: nil,
      trip_id: "t1"
    },
    @stop_time_update
  ]

  describe "start_link/1" do
    test "can start" do
      start_supervised!(StopTimeUpdates)
    end
  end

  describe "handle_events/3" do
    setup do
      reassign_env(:realtime, :trip_fn, fn _trip_id -> @trip end)
      reassign_env(:realtime, :block_fn, fn _block_id, _service_id -> nil end)

      events = [@all_updates]

      {:ok, events: events}
    end

    test "returns noreply", %{events: events} do
      response = StopTimeUpdates.handle_events(events, nil, %{})

      assert response == {:noreply, [], %{}}
    end
  end

  describe "stop_time_updates_by_trip/1" do
    test "groups stop time updates by trip, filtering out trips with no stop time updates" do
      expected = %{
        "t1" => [@stop_time_update]
      }

      assert StopTimeUpdates.stop_time_updates_by_trip(@all_updates) == expected
    end
  end

  describe "backend implementation" do
    test "handles reference info calls that come in after a timeout" do
      state = %{}

      response = StopTimeUpdates.handle_info({make_ref(), %{}}, state)

      assert response == {:noreply, [], state}
    end
  end
end
