defmodule Schedule.Health.Checkers.RoutesCheckerTest do
  use ExUnit.Case
  import Test.Support.Helpers

  alias Schedule.Health.Checkers.RoutesChecker

  describe "healthy?/1" do
    setup do
      reassign_env(:skate_web, :routes_fn, fn -> [1, 2, 3] end)
    end

    test "checks if Schedule returns at least the configured min number of routes" do
      assert RoutesChecker.healthy?(%{min_length: 3})
      refute RoutesChecker.healthy?(%{min_length: 4})
    end
  end
end
