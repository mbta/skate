defmodule Concentrate.Supervisor.PipelineTest do
  @moduledoc false
  use ExUnit.Case, async: true

  alias Concentrate.Supervisor.Pipeline

  describe "children/1" do
    setup do
      real_trip_fn = Application.get_env(:realtime, :trip_fn)

      on_exit(fn ->
        Application.put_env(:realtime, :trip_fn, real_trip_fn)
      end)

      Application.put_env(:realtime, :trip_fn, fn _trip_id -> nil end)
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
