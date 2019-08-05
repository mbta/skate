defmodule Concentrate.Supervisor.PipelineTest do
  @moduledoc false
  use ExUnit.Case, async: true
  import Test.Support.Helpers

  alias Concentrate.Supervisor.Pipeline

  describe "children/1" do
    setup do
      reassign_env(:realtime, :trip_fn, fn _trip_id -> nil end)
      reassign_env(:realtime, :block_fn, fn _block_id, _service_id -> nil end)
    end

    test "builds the right number of children" do
      opts = [
        busloc_url: "http://example.com/busloc.json",
        swiftly_authorization_key: "12345",
        swiftly_realtime_vehicles_url: "http://example.com/swiftly_realtime_vehicles.json"
      ]

      actual = Pipeline.children(opts)

      # 2 sources + merge + 1 consumer
      assert length(actual) == 4
    end
  end
end
