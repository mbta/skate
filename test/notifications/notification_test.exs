defmodule Notifications.NotificationTest do
  use Skate.DataCase

  alias Notifications.Notification
  alias Notifications.Db.NotificationUser, as: DbNotificationUser
  alias Skate.Settings.RouteSettings
  alias Skate.Settings.User

  describe "get_or_create/1" do
    test "associates a new notification with users subscribed to an affected route" do
      user1 = User.get_or_create("user1")
      user2 = User.get_or_create("user2")
      User.get_or_create("user3")

      RouteSettings.get_or_create("user1")
      RouteSettings.get_or_create("user2")
      RouteSettings.get_or_create("user3")

      RouteSettings.set("user1", selected_route_ids: ["4", "1"])
      RouteSettings.set("user2", selected_route_ids: ["2"])
      RouteSettings.set("user3", selected_route_ids: ["4", "5", "6", "7"])

      notification_without_id = %Notification{
        created_at: 12345,
        block_id: "Z1-1",
        service_id: "FallWeekday",
        reason: :other,
        route_ids: ["1", "2", "3"],
        run_ids: ["56785678", "101010"],
        trip_ids: ["250624", "250625"],
        start_time: 1_000_000_000,
        end_time: 1_000_086_400
      }

      notification_with_id = Notification.get_or_create(notification_without_id)

      notification_users = Skate.Repo.all(from(DbNotificationUser))
      assert(length(notification_users) == 2)
      assert(Enum.all?(notification_users, &(&1.notification_id == notification_with_id.id)))
      assert(Enum.all?(notification_users, &(&1.state == :unread)))

      assert(
        notification_users |> Enum.map(& &1.user_id) |> Enum.sort() ==
          [user1.id, user2.id] |> Enum.sort()
      )
    end
  end
end
