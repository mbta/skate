defmodule Notifications.Db.NotificationUserTest do
  use Skate.DataCase

  import Skate.Factory

  alias Notifications.Db.Notification, as: DbNotification
  alias Notifications.Db.NotificationUser, as: DbNotificationUser

  describe "NotificationUser" do
    test "can be saved to the database" do
      {:ok, notification} =
        DbNotification.block_waiver_changeset(%DbNotification{}, %{
          created_at: 1,
          block_id: "blk",
          service_id: "srv",
          reason: :other,
          route_ids: [],
          run_ids: [],
          trip_ids: [],
          start_time: 123,
          end_time: 456
        })
        |> Skate.Repo.insert()

      user = insert(:user)

      Skate.Repo.insert!(%DbNotificationUser{
        notification_id: notification.id,
        user_id: user.id,
        state: :deleted
      })

      assert Skate.Repo.one(DbNotificationUser,
               notification_id: notification.id,
               user_id: user.id
             ).state == :deleted
    end
  end
end
