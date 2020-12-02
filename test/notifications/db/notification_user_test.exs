defmodule Notifications.Db.NotificationUserTest do
  use Skate.DataCase

  alias Notifications.Db.Notification, as: DbNotification
  alias Notifications.Db.NotificationUser, as: DbNotificationUser
  alias Skate.Settings.Db.User, as: DbUser

  describe "NotificationUser" do
    test "can be saved to the database" do
      {:ok, notification} =
        DbNotification.changeset(%DbNotification{}, %{
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

      {:ok, user} =
        DbUser.changeset(%DbUser{}, %{username: "charlie"})
        |> Skate.Repo.insert()

      notification_user =
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
