defmodule Concentrate.Pipeline.StopTimeUpdatesPipelineSupervisorTest do
  @moduledoc false
  use ExUnit.Case, async: true

  describe "start_link/0" do
    test "can start the application" do
      Application.ensure_all_started(:stop_time_updates_pipeline)

      on_exit(fn ->
        Application.stop(:stop_time_updates_pipeline)
      end)
    end
  end
end
