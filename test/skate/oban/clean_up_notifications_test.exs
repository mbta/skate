defmodule Skate.Oban.CleanUpNotificationsTest do
  use Skate.DataCase
  use Oban.Testing, repo: Skate.Repo

  alias Notifications.Db.Notification
  alias Skate.Oban.CleanUpNotifications
  alias Skate.Factory

  describe "when job runs" do
    test "limits deletions to the limit parameter" do
      limit = 250
      extra = 750
      Factory.insert_list(limit + extra, :db_notification)

      # Delete records. Set cutoff to be 1 day in the future.
      assert {:ok, limit} ==
               perform_job(CleanUpNotifications, %{"limit" => limit, "cutoff_days" => -1})

      # Table count is `total - limit = extra`
      assert extra ==
               from(n in Notification, select: count(n.id))
               |> Skate.Repo.one()
    end

    @seconds_per_day 24 * 60 * 60

    test "only deletes records older than the cutoff_days date" do
      # Insert elements older than `cutoff_days`
      cutoff_days = 100
      insert_date = DateTime.utc_now() |> DateTime.add(-(cutoff_days + 1) * @seconds_per_day)
      limit = 250
      Factory.insert_list(limit, :db_notification, inserted_at: insert_date)

      extra = 750
      Factory.insert_list(extra, :db_notification)

      # Delete all old records
      assert {:ok, limit} ==
               perform_job(CleanUpNotifications, %{"cutoff_days" => cutoff_days, "limit" => limit})

      assert extra ==
               from(n in Notification, select: count(n.id))
               |> Skate.Repo.one()
    end
  end
end
