defmodule Realtime.DataStatusTest do
  use ExUnit.Case
  import Test.Support.Helpers

  alias Realtime.DataStatus

  @now 10000
  @fresh @now - 15
  @stale @now - 3600

  @good %{
    timestamp: @fresh,
    route_id: "route"
  }
  @bad %{
    timestamp: @stale,
    route_id: "route"
  }
  @irrelevant %{
    timestamp: @stale,
    route_id: nil
  }

  describe "data_status" do
    setup do
      reassign_env(:skate, :now_fn, fn -> @now end)
    end

    test "if most vehicles are good, status is good" do
      assert DataStatus.data_status([@good, @good, @bad, @good]) == :good
    end

    test "if many vehicles are bad, status is outage" do
      assert DataStatus.data_status([@bad, @bad, @good, @good]) == :outage
    end

    test "doesn't consider irrelevant vehicles" do
      assert DataStatus.data_status([@irrelevant, @irrelevant, @good, @good]) == :good
    end

    test "when there are no vehicles overnight, that's okay" do
      assert DataStatus.data_status([]) == :good
    end
  end
end
