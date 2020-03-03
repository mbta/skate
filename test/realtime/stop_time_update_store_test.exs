defmodule StopTimeUpdateStoreTest do
  use ExUnit.Case, async: true

  alias Concentrate.StopTimeUpdate
  alias Realtime.StopTimeUpdateStore

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

  describe "start_link/1" do
    test "starts up and lives" do
      {:ok, server} = StopTimeUpdateStore.start_link(name: :start_link)

      Process.sleep(10)

      assert Process.alive?(server)
    end
  end

  describe "stop_time_updates_for_trip/1" do
    setup do
      {:ok, server} = StopTimeUpdateStore.start_link(name: :stop_time_updates_for_trip)

      {:ok, server: server}
    end

    test "get the StopTimeUpdates for the requested trip ID", %{server: server} do
      :sys.replace_state(server, fn state ->
        Map.put(state, :stop_time_updates_by_trip, @stop_time_updates_by_trip)
      end)

      assert StopTimeUpdateStore.stop_time_updates_for_trip("trip1", server) == @stop_time_updates
    end
  end

  describe "set/1" do
    setup do
      {:ok, server} = StopTimeUpdateStore.start_link(name: :set)

      {:ok, server: server}
    end

    test "stores the StopTimeUpdates by trip ID", %{server: server} do
      assert StopTimeUpdateStore.set(@stop_time_updates_by_trip, server) == :ok

      assert %{stop_time_updates_by_trip: @stop_time_updates_by_trip} = :sys.get_state(server)
    end
  end
end
