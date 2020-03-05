defmodule Concentrate.Pipeline.VehiclePositionsPipelineTest do
  use ExUnit.Case, async: true
  import Test.Support.Helpers

  describe "pipeline/1" do
    setup do
      reassign_env(:realtime, :trip_fn, fn _trip_id -> nil end)
      reassign_env(:realtime, :block_fn, fn _block_id, _service_id -> nil end)
    end

    test "includes 2 sources, merge, and 1 consumer in the pipeline" do
      opts = [
        busloc_url: "http://example.com/busloc.json",
        swiftly_authorization_key: "12345",
        swiftly_realtime_vehicles_url: "http://example.com/swiftly_realtime_vehicles.json"
      ]

      pipeline_elements = Concentrate.Pipeline.VehiclePositionsPipeline.pipeline(opts)

      assert length(pipeline_elements) == 4
    end
  end
end
