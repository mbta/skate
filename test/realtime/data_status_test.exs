defmodule Realtime.DataStatusTest do
  use ExUnit.Case
  import Test.Support.Helpers
  import ExUnit.CaptureLog

  alias Realtime.DataStatus

  @now 10_000
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

      log_level = Logger.level()

      on_exit(fn ->
        Logger.configure(level: log_level)
      end)

      Logger.configure(level: :info)
    end

    test "if there are fewer than 20 revenue vehicles, status is good" do
      bads = List.duplicate(@bad, 19)
      irrelevants = List.duplicate(@irrelevant, 20)
      vehicles = bads ++ irrelevants

      log =
        capture_log([level: :info], fn -> assert DataStatus.data_status(vehicles) == :good end)

      assert log =~ "total_vehicles=39"
      assert log =~ "considered_vehicles=19"
      assert log =~ "good_vehicles=0"
      assert log =~ "good_busloc_vehicles=0"
      assert log =~ "good_swiftly_vehicles=0"
      assert log =~ "bad_vehicles=19"
    end

    test "if most vehicles are good, status is good" do
      goods = List.duplicate(@good, 17)

      log =
        capture_log([level: :info], fn ->
          assert DataStatus.data_status([@bad, @bad, @bad | goods]) == :good
        end)

      assert log =~ "total_vehicles=20"
      assert log =~ "considered_vehicles=20"
      assert log =~ "good_vehicles=17"
      assert log =~ "good_busloc_vehicles=17"
      assert log =~ "good_swiftly_vehicles=17"
      assert log =~ "bad_vehicles=3"
    end

    test "if many vehicles are bad, status is outage" do
      goods = List.duplicate(@good, 16)

      log =
        capture_log([level: :info], fn ->
          assert DataStatus.data_status([@bad, @bad, @bad, @bad | goods]) == :outage
        end)

      assert log =~ "total_vehicles=20"
      assert log =~ "considered_vehicles=20"
      assert log =~ "good_vehicles=16"
      assert log =~ "good_busloc_vehicles=16"
      assert log =~ "good_swiftly_vehicles=16"
      assert log =~ "bad_vehicles=4"
    end

    test "considers vehicles bad if either source is stale or missing" do
      goods = List.duplicate(@good, 16)

      Enum.each(
        [
          {[@swiftly_missing, @swiftly_missing, @swiftly_missing, @swiftly_missing | goods], 20,
           16},
          {[@swiftly_stale, @swiftly_stale, @swiftly_stale, @swiftly_stale | goods], 20, 16},
          {[@busloc_missing, @busloc_missing, @busloc_missing, @busloc_missing | goods], 16, 20},
          {[@busloc_stale, @busloc_stale, @busloc_stale, @busloc_stale | goods], 16, 20}
        ],
        fn {vehicles, busloc_good, swiftly_good} ->
          log =
            capture_log([level: :info], fn ->
              assert DataStatus.data_status(vehicles) == :outage
            end)

          assert log =~ "total_vehicles=20"
          assert log =~ "considered_vehicles=20"
          assert log =~ "good_vehicles=16"
          assert log =~ "good_busloc_vehicles=#{busloc_good}"
          assert log =~ "good_swiftly_vehicles=#{swiftly_good}"
          assert log =~ "bad_vehicles=4"
        end
      )
    end

    test "when there are no vehicles overnight, that's okay" do
      log = capture_log([level: :info], fn -> assert DataStatus.data_status([]) == :good end)

      assert log =~ "total_vehicles=0"
      assert log =~ "considered_vehicles=0"
      assert log =~ "good_vehicles=0"
      assert log =~ "good_busloc_vehicles=0"
      assert log =~ "good_swiftly_vehicles=0"
      assert log =~ "bad_vehicles=0"
    end
  end
end
