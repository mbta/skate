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

    test "if there are fewer than 10 revenue vehicles, status is good" do
      bads = List.duplicate(@bad, 9)
      irrelevants = List.duplicate(@irrelevant, 20)
      vehicles = bads ++ irrelevants
      assert DataStatus.data_status(vehicles) == :good
    end

    test "if most vehicles are good, status is good" do
      goods = List.duplicate(@good, 9)
      assert DataStatus.data_status([@bad | goods]) == :good
    end

    test "if many vehicles are bad, status is outage" do
      goods = List.duplicate(@good, 8)
      assert DataStatus.data_status([@bad, @bad | goods]) == :outage
    end

    test "considers vehicles bad if either source is stale or missing" do
      goods = List.duplicate(@good, 8)

      [
        [@swiftly_missing, @swiftly_missing | goods],
        [@swiftly_stale, @swiftly_stale | goods],
        [@busloc_missing, @busloc_missing | goods],
        [@busloc_stale, @busloc_stale | goods]
      ]
      |> Enum.each(&assert DataStatus.data_status(&1) == :outage)
    end

    test "when there are no vehicles overnight, that's okay" do
      assert DataStatus.data_status([]) == :good
    end
  end
end
