defmodule TrainVehicles.SupervisorTest do
  use ExUnit.Case, async: true
  import Test.Support.Helpers

  setup do
    reassign_env(:skate, :api_url, "http://example.com")
    reassign_env(:skate, :api_key, "12345678")
  end

  describe "init/1" do
    test "definites child_specs" do
      assert {:ok, {_flags, [_child_spec | _]}} = TrainVehicles.Supervisor.init(:ok)
    end
  end
end
