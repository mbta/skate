defmodule Concentrate.SupervisorTest do
  @moduledoc false
  use ExUnit.Case, async: true

  @opts [
    busloc_url: "http://example.com/busloc.json",
    swiftly_authorization_key: "12345",
    swiftly_realtime_vehicles_url: "http://example.com/swiftly_realtime_vehicles.json",
    trip_updates_url: "http://example.com/TripUpdates_enhanced.json"
  ]

  describe "start_link/1" do
    test "can start the application" do
      assert {:ok, _pid} = Concentrate.Supervisor.start_link(@opts)
    end

    test "starts the data pipelines" do
      {:ok, pid} = Concentrate.Supervisor.start_link(@opts)

      assert [
               {
                 Concentrate.Pipeline.VehiclePositionsPipeline,
                 _pid,
                 :supervisor,
                 [Concentrate.Pipeline]
               }
             ] = Supervisor.which_children(pid)
    end
  end

  describe "child_spec/1" do
    test "defines a supervisor spec, passing along the given opts" do
      assert %{
               type: :supervisor,
               start: {Concentrate.Supervisor, :start_link, [@opts]}
             } = Concentrate.Supervisor.child_spec(@opts)
    end
  end
end
