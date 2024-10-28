defmodule Report.NotificationsCountEstimateTest do
  use Skate.DataCase

  describe "run/0" do
    test "returns a single-row numeric value" do
      {:ok, result} = Report.NotificationsCountEstimate.run()

      assert [%{count: count}] = result

      assert is_number(count)
    end
  end

  describe "short_name/0" do
    test "returns short name" do
      assert Report.NotificationsCountEstimate.short_name() == "notifications_count_estimate"
    end
  end

  describe "description/0" do
    test "returns description" do
      assert Report.NotificationsCountEstimate.description() == "Estimated count of notifications"
    end
  end
end
