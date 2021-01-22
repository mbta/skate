defmodule Realtime.DataStatusTest do
  use ExUnit.Case
  import Test.Support.Helpers

  alias Realtime.DataStatus

  @now 10000
  @fresh @now - 15
  @stale @now - 3600

  @good %{
    route_id: "route",
    timestamp_by_source: %{"busloc" => @fresh, "swiftly" => @fresh}
  }
  @bad %{
    route_id: "route",
    timestamp_by_source: %{"busloc" => @stale, "swiftly" => @stale}
  }
  @swiftly_stale %{
    route_id: "route",
    timestamp_by_source: %{"busloc" => @fresh, "swiftly" => @stale}
  }
  @swiftly_missing %{route_id: "route", timestamp_by_source: %{"busloc" => @fresh}}
  @busloc_stale %{
    route_id: "route",
    timestamp_by_source: %{"busloc" => @stale, "swiftly" => @fresh}
  }
  @busloc_missing %{route_id: "route", timestamp_by_source: %{"swiftly" => @fresh}}
  @irrelevant %{
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

    test "considers vehicles bad if either source is stale or missing" do
      [
        [@swiftly_missing, @swiftly_missing, @good, @good],
        [@swiftly_stale, @swiftly_stale, @good, @good],
        [@busloc_missing, @busloc_missing, @good, @good],
        [@busloc_stale, @busloc_stale, @good, @good]
      ]
      |> Enum.each(&assert DataStatus.data_status(&1) == :outage)
    end

    test "doesn't consider irrelevant vehicles" do
      assert DataStatus.data_status([@irrelevant, @irrelevant, @good, @good]) == :good
    end

    test "when there are no vehicles overnight, that's okay" do
      assert DataStatus.data_status([]) == :good
    end
  end
end
