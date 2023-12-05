defmodule Skate.Oban.CleanUpNotificationsTest do
  use Skate.DataCase
  use Oban.Testing, repo: Skate.Repo

  require Test.Support.Helpers

  alias ExUnit.CaptureLog

  alias Notifications.Db.Notification
  alias Skate.Oban.CleanUpNotifications
  alias Skate.Factory

  describe "when job runs" do
    @tag :capture_log
    test "logs number of deletions when job runs" do
      Test.Support.Helpers.set_log_level(:notice)

      total = 100
      Factory.insert_list(total, :db_notification)

      # Delete records. Set cutoff to be 1 day in the future.
      log =
        CaptureLog.capture_log([level: :notice, colors: [enabled: false]], fn ->
          assert {:ok, total} ==
                   perform_job(CleanUpNotifications, %{"limit" => total, "cutoff_days" => -1})
        end)

      assert log =~ "#{Skate.Oban.CleanUpNotifications} starting cleanup"

      assert log =~
               ~r/#{Skate.Oban.CleanUpNotifications} finished cleanup deleted=#{total} time_in_ms=\d+/

      assert 0 == Skate.Repo.aggregate(Notification, :count, :id)
    end

    test "limits deletions to the limit parameter" do
      limit = 250
      extra = 750
      Factory.insert_list(limit + extra, :db_notification)

      # Delete records. Set cutoff to be 1 day in the future.
      assert {:ok, limit} ==
               perform_job(CleanUpNotifications, %{"limit" => limit, "cutoff_days" => -1})

      # Table count is `total - limit = extra`
      assert extra == Skate.Repo.aggregate(Notification, :count, :id)
    end

    @seconds_per_day 24 * 60 * 60

    test "only deletes records older than the cutoff_days date" do
      # Insert elements older than `cutoff_days`
      cutoff_days = 100
      insert_date = DateTime.add(DateTime.utc_now(), -(cutoff_days + 1) * @seconds_per_day)
      limit = 250
      Factory.insert_list(limit, :db_notification, inserted_at: insert_date)

      extra = 750
      Factory.insert_list(extra, :db_notification)

      # Delete all old records
      assert {:ok, limit} ==
               perform_job(CleanUpNotifications, %{"cutoff_days" => cutoff_days, "limit" => limit})

      assert extra == Skate.Repo.aggregate(Notification, :count, :id)
    end
  end
end
