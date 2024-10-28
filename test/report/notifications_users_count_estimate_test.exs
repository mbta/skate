defmodule Report.NotificationsUsersCountEstimateTest do
  use Skate.DataCase

  describe "run/0" do
    test "returns a single-row numeric value" do
      {:ok, result} = Report.NotificationsUsersCountEstimate.run()

      assert [%{count: count}] = result

      assert is_number(count)
    end
  end

  describe "short_name/0" do
    test "returns short name" do
      assert Report.NotificationsUsersCountEstimate.short_name() ==
               "notifications_users_count_estimate"
    end
  end

  describe "description/0" do
    test "returns description" do
      assert Report.NotificationsUsersCountEstimate.description() ==
               "Estimated count of notifications_users"
    end
  end
end
