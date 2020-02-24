defmodule Concentrate.Supervisor.StopTimeUpdatesTest do
  @moduledoc false
  use ExUnit.Case, async: true

  alias Concentrate.Consumer.StopTimeUpdates

  @stop_time_update %Concentrate.StopTimeUpdate{
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

  @groups [
    {
      %Concentrate.TripUpdate{
        direction_id: nil,
        remark: nil,
        route_id: "r1",
        schedule_relationship: :SCHEDULED,
        start_date: nil,
        start_time: nil,
        trip_id: "t1"
      },
      [],
      [@stop_time_update]
    },
    {
      %Concentrate.TripUpdate{
        direction_id: nil,
        remark: nil,
        route_id: "r1",
        schedule_relationship: :SCHEDULED,
        start_date: nil,
        start_time: nil,
        trip_id: "t2"
      },
      [],
      []
    }
  ]

  describe "start_link/1" do
    test "can start" do
      start_supervised!(StopTimeUpdates)
    end
  end

  describe "handle_events/3" do
    setup do
      events = [@groups]

      {:ok, events: events}
    end

    test "returns noreply", %{events: events} do
      response = StopTimeUpdates.handle_events(events, nil, %{})

      assert response == {:noreply, [], %{}}
    end
  end

  describe "stop_time_updates_from_groups/1" do
    test "groups stop time updates by trip, filtering out trips with no stop time updates" do
      expected = %{
        "t1" => [@stop_time_update]
      }

      assert StopTimeUpdates.stop_time_updates_from_groups(@groups) == expected
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
