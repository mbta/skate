defmodule Schedule.Health.Checkers.RoutesCheckerTest do
  use ExUnit.Case
  import Test.Support.Helpers

  import ExUnit.CaptureLog
  require Logger

  alias Schedule.Health.Checkers.RoutesChecker

  describe "healthy?/1" do
    setup do
      reassign_env(:skate_web, :routes_fn, fn -> [1, 2, 3] end)
    end

    test "checks if Schedule returns at least the configured min number of routes" do
      assert RoutesChecker.healthy?(%{min_length: 3})
      refute RoutesChecker.healthy?(%{min_length: 4})
    end

    test "verify logging when health checker fails" do
      assert capture_log(fn ->
               RoutesChecker.healthy?(%{min_length: 4})
             end) =~ "failed. min_length=4 length=3"
    end
  end
end
