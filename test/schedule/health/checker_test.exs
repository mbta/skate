defmodule Schedule.Health.CheckerTest do
  use ExUnit.Case
  import Test.Support.Helpers

  alias Schedule.Health.Checker

  describe "healthy?" do
    setup do
      reassign_env(:skate_web, :routes_fn, fn -> [] end)
      reassign_env(:skate_web, :timepoints_on_route_fn, fn _route_id -> [] end)

      reassign_env(:skate_web, :first_route_pattern_for_route_and_direction_fn, fn _route_id,
                                                                                   _direction ->
        nil
      end)

      reassign_env(:realtime, :trip_fn, fn _trip_id -> nil end)
    end

    test "returns a boolean" do
      assert is_boolean(Checker.healthy?())
    end
  end
end
