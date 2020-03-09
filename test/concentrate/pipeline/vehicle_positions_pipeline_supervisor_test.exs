defmodule Concentrate.Pipeline.VehiclePositionsPipelineSupervisorTest do
  @moduledoc false
  use ExUnit.Case, async: true

  describe "start_link/0" do
    test "can start the application" do
      Application.ensure_all_started(:vehicle_positions_pipeline)

      on_exit(fn ->
        Application.stop(:vehicle_positions_pipeline)
      end)
    end
  end
end
