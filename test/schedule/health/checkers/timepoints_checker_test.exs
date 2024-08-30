defmodule Schedule.Health.Checkers.TimepointsCheckerTest do
  use ExUnit.Case
  import Test.Support.Helpers

  import ExUnit.CaptureLog
  require Logger

  alias Schedule.Health.Checkers.TimepointsChecker

  describe "healthy?/1" do
    setup do
      reassign_env(:skate_web, :timepoints_on_route_fn, fn _route_id -> [1, 2, 3] end)
    end

    test "checks if Schedule returns at least the configured min number of timepoints per route" do
      assert TimepointsChecker.healthy?([
               %{route_id: "1", min_length: 3},
               %{route_id: "2", min_length: 3}
             ])

      refute TimepointsChecker.healthy?([
               %{route_id: "1", min_length: 3},
               %{route_id: "2", min_length: 4}
             ])
    end

    test "verify logging when health checker fails" do
      assert capture_log(fn ->
               TimepointsChecker.healthy?([
                 %{route_id: "1", min_length: 3},
                 %{route_id: "2", min_length: 4}
               ])
             end) =~ "failed on route_id=2. min_length=4 length=3"
    end
  end
end
