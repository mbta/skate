defmodule Concentrate.SupervisorTest do
  @moduledoc false
  use ExUnit.Case, async: true
  import Test.Support.Helpers

  describe "start_link/0" do
    test "can start the application" do
      Application.ensure_all_started(:concentrate)

      on_exit(fn ->
        Application.stop(:concentrate)
      end)
    end
  end

  describe "children/1" do
    setup do
      reassign_env(:realtime, :trip_fn, fn _trip_id -> nil end)
      reassign_env(:realtime, :block_fn, fn _block_id, _service_id -> nil end)
    end

    test "builds the right number of children" do
      opts = [
        busloc_url: "http://example.com/busloc.json",
        swiftly_authorization_key: "12345",
        swiftly_realtime_vehicles_url: "http://example.com/swiftly_realtime_vehicles.json",
        trip_updates_url: "http://example.com/TripUpdates_enhanced.json"
      ]

      pipelines = Concentrate.Supervisor.children(opts)

      # Pipelines = VehiclePositionsPipeline + StopTimeUpdatesPipeline
      assert length(pipelines) == 2
    end
  end
end
