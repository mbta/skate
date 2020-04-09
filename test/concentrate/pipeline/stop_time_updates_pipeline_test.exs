defmodule Concentrate.Pipeline.StopTimeUpdatesPipelineTest do
  use ExUnit.Case
  import Test.Support.Helpers

  describe "init/1" do
    setup do
      reassign_env(:realtime, :trip_fn, fn _trip_id -> nil end)
      reassign_env(:realtime, :block_fn, fn _block_id, _service_id -> nil end)
    end

    test "includes 1 source and 1 consumer in the pipeline" do
      opts = [
        trip_updates_url: "http://example.com/TripUpdates_enhanced.json"
      ]

      pipeline_elements = Concentrate.Pipeline.StopTimeUpdatesPipeline.init(opts)

      assert length(pipeline_elements) == 2
    end
  end
end
