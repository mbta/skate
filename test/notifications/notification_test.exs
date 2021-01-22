defmodule Notifications.NotificationTest do
  use Skate.DataCase

  alias Notifications.Notification
  alias Notifications.Db.BlockWaiver, as: DbBlockWaiver
  alias Notifications.Db.Notification, as: DbNotification
  alias Notifications.Db.NotificationUser, as: DbNotificationUser
  alias Skate.Settings.RouteSettings
  alias Skate.Settings.User

  import Ecto.Query

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

    test "duplicates the block waiver data to the notifications table" do
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

      Notification.get_or_create(notification_without_id)

      db_notification = Skate.Repo.one!(from(DbNotification))
      db_block_waiver = Skate.Repo.one!(from(DbBlockWaiver))

      assert db_notification.block_waiver_id == db_block_waiver.id

      assert db_notification.created_at == db_block_waiver.created_at
      assert db_notification.block_id == db_block_waiver.block_id
      assert db_notification.service_id == db_block_waiver.service_id
      assert db_notification.reason == db_block_waiver.reason
      assert db_notification.route_ids == db_block_waiver.route_ids
      assert db_notification.run_ids == db_block_waiver.run_ids
      assert db_notification.trip_ids == db_block_waiver.trip_ids
      assert db_notification.start_time == db_block_waiver.start_time
      assert db_notification.end_time == db_block_waiver.end_time
    end
  end

  describe "unexpired_notifications_for_user/2" do
    test "returns all unexpired notifications for the given user, in chronological order by creation timestamp" do
      baseline_time = 1_000_000_000
      now_fn = fn -> baseline_time end
      naive_now_fn = fn -> baseline_time |> DateTime.from_unix!() |> DateTime.to_naive() end
      Application.put_env(:skate, :naive_now_fn, naive_now_fn)
      eight_hours = 8 * 60 * 60

      RouteSettings.get_or_create("user1")
      RouteSettings.get_or_create("user2")
      RouteSettings.set("user1", selected_route_ids: ["1", "2"])
      RouteSettings.set("user2", selected_route_ids: ["1", "3"])

      route_1_unexpired =
        Notification.get_or_create(%Notification{
          block_id: "block",
          service_id: "service",
          reason: :other,
          run_ids: [],
          trip_ids: [],
          start_time: 0,
          created_at: baseline_time - eight_hours + 10,
          route_ids: ["1"],
          end_time: 10000
        })

      _route_1_expired =
        Notification.get_or_create(%Notification{
          block_id: "block",
          service_id: "service",
          reason: :other,
          run_ids: [],
          trip_ids: [],
          start_time: 1,
          created_at: baseline_time - eight_hours,
          route_ids: ["1"],
          end_time: 2
        })

      route_2_unexpired =
        Notification.get_or_create(%Notification{
          block_id: "block",
          service_id: "service",
          reason: :other,
          run_ids: [],
          trip_ids: [],
          start_time: 4,
          created_at: baseline_time - eight_hours + 1,
          route_ids: ["2"],
          end_time: 5000
        })

      _route_2_expired =
        Notification.get_or_create(%Notification{
          block_id: "block",
          service_id: "service",
          reason: :other,
          run_ids: [],
          trip_ids: [],
          start_time: 6,
          created_at: baseline_time - eight_hours,
          route_ids: ["2"],
          end_time: 7
        })

      route_3_unexpired =
        Notification.get_or_create(%Notification{
          block_id: "block",
          service_id: "service",
          reason: :other,
          run_ids: [],
          trip_ids: [],
          start_time: 8,
          created_at: baseline_time - eight_hours + 5,
          route_ids: ["3"],
          end_time: 9000
        })

      _route_3_expired =
        Notification.get_or_create(%Notification{
          block_id: "block",
          service_id: "service",
          reason: :other,
          run_ids: [],
          trip_ids: [],
          start_time: 10,
          created_at: baseline_time - eight_hours,
          route_ids: ["3"],
          end_time: 11
        })

      multiroute_unexpired =
        Notification.get_or_create(%Notification{
          block_id: "block",
          service_id: "service",
          reason: :other,
          run_ids: [],
          trip_ids: [],
          start_time: 12,
          created_at: baseline_time - eight_hours + 3,
          route_ids: ["2", "3"],
          end_time: 8000
        })

      _multiroute_expired =
        Notification.get_or_create(%Notification{
          block_id: "block",
          service_id: "service",
          reason: :other,
          run_ids: [],
          trip_ids: [],
          start_time: 14,
          created_at: baseline_time - eight_hours,
          route_ids: ["2", "3"],
          end_time: 15
        })

      _route_4_unexpired =
        Notification.get_or_create(%Notification{
          block_id: "block",
          service_id: "service",
          reason: :other,
          run_ids: [],
          trip_ids: [],
          start_time: 16,
          created_at: baseline_time - eight_hours + 3,
          route_ids: ["4"],
          end_time: 17
        })

      _route_4_expired =
        Notification.get_or_create(%Notification{
          block_id: "block",
          service_id: "service",
          reason: :other,
          run_ids: [],
          trip_ids: [],
          start_time: 18,
          created_at: baseline_time - eight_hours,
          route_ids: ["4"],
          end_time: 19
        })

      user1_notification_ids =
        Notification.unexpired_notifications_for_user("user1", now_fn) |> Enum.map(& &1.id)

      user2_notification_ids =
        Notification.unexpired_notifications_for_user("user2", now_fn) |> Enum.map(& &1.id)

      assert user1_notification_ids == [
               route_1_unexpired.id,
               multiroute_unexpired.id,
               route_2_unexpired.id
             ]

      assert user2_notification_ids == [
               route_1_unexpired.id,
               route_3_unexpired.id,
               multiroute_unexpired.id
             ]
    end
  end
end
