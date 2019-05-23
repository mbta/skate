defmodule Concentrate.Supervisor.PipelineTest do
  @moduledoc false
  use ExUnit.Case, async: true

  alias Concentrate.Supervisor.Pipeline

  describe "children/1" do
    setup do
      real_stop_times_on_trip_fn = Application.get_env(:realtime, :stop_times_on_trip_fn)

      on_exit(fn ->
        Application.put_env(:realtime, :stop_times_on_trip_fn, real_stop_times_on_trip_fn)
      end)

      Application.put_env(:realtime, :stop_times_on_trip_fn, fn _trip_id -> [] end)
    end

    test "builds the right number of children" do
      opts = [
        concentrate_vehicle_positions_url:
          "http://example.com/concentrate_vehicle_positions.json",
        busloc_url: "http://example.com/busloc.json"
      ]

      actual = Pipeline.children(opts)

      # 2 sources + merge + 1 consumer
      assert length(actual) == 4
    end
  end
end
