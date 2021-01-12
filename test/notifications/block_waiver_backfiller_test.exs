defmodule Notifications.BlockWaiverBackfillerTest do
  use Skate.DataCase
  import ExUnit.CaptureLog

  alias Notifications.Db.BlockWaiver, as: DbBlockWaiver
  alias Notifications.Db.Notification, as: DbNotification
  alias Notifications.BlockWaiverBackfiller

  setup do
    1..6
    |> Enum.each(fn index ->
      changeset =
        DbNotification.changeset(
          %DbNotification{},
          %{
            created_at: index,
            reason: :manpower,
            route_ids: [],
            run_ids: [],
            trip_ids: [],
            block_id: "blk_#{index}",
            service_id: "WinterWeekday",
            start_time: index * 100,
            end_time: index * 500
          }
        )

      Skate.Repo.insert!(changeset)
    end)
  end

  test "logs the number of notifications still needing backfill" do
    Logger.configure(level: :info)

    log =
      capture_log(fn ->
        BlockWaiverBackfiller.handle_info(:backfill_batch, nil)
      end)

    assert(String.contains?(log, "backfill_batch notifications_requiring_backfill_count=6"))

    Logger.configure(level: :warn)
  end

  test "backfills a batch of notifications" do
    BlockWaiverBackfiller.handle_info(:backfill_batch, nil)

    updated_notifications = Skate.Repo.all(from(DbNotification))
    block_waivers = Skate.Repo.all(from(DbBlockWaiver))

    assert length(block_waivers) == 5

    notifications_with_block_waivers =
      Enum.reject(updated_notifications, &(&1.block_waiver_id == nil))

    assert length(notifications_with_block_waivers) == 5
  end
end
