defmodule Notifications.NotificationTest do
  use Skate.DataCase
  import Skate.Factory

  alias Notifications.Notification
  alias Notifications.Db.Notification, as: DbNotification
  alias Notifications.Db.NotificationUser, as: DbNotificationUser
  alias Skate.Settings.RouteTab
  alias Skate.Settings.User

  import Ecto.Query

  @chelsea_st_bridge_route_ids ["112", "743"]

  describe "get_or_create_from_block_waiver/1" do
    test "associates a new notification with users subscribed to an affected route" do
      user1 = User.upsert("user1")
      user2 = User.upsert("user2")
      User.upsert("user3")

      route_tab1 =
        build(:route_tab, %{
          preset_name: "some routes",
          selected_route_ids: ["4", "1"]
        })

      RouteTab.update_all_for_user!("user1", [route_tab1])

      route_tab2 =
        build(:route_tab, %{
          preset_name: "some routes",
          selected_route_ids: ["2"]
        })

      RouteTab.update_all_for_user!("user2", [route_tab2])

      route_tab3 =
        build(:route_tab, %{
          preset_name: "some routes",
          selected_route_ids: ["4", "5", "6", "7"]
        })

      RouteTab.update_all_for_user!("user3", [route_tab3])

      notification_values = %{
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

      notification_with_id = Notification.get_or_create_from_block_waiver(notification_values)

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

  describe "unexpired_notifications_for_user/2" do
    test "returns all unexpired notifications for the given user, in chronological order by creation timestamp" do
      User.upsert("user1")
      User.upsert("user2")
      baseline_time = 1_000_000_000
      now_fn = fn -> baseline_time end
      naive_now_fn = fn -> baseline_time |> DateTime.from_unix!() |> DateTime.to_naive() end
      Application.put_env(:skate, :naive_now_fn, naive_now_fn)
      eight_hours = 8 * 60 * 60

      route_tab1 =
        build(:route_tab, %{
          preset_name: "some routes",
          selected_route_ids: ["1", "2", "112"]
        })

      RouteTab.update_all_for_user!("user1", [route_tab1])

      route_tab2 =
        build(:route_tab, %{
          preset_name: "some routes",
          selected_route_ids: ["1", "3", "743"]
        })

      RouteTab.update_all_for_user!("user2", [route_tab2])

      route_1_unexpired =
        Notification.get_or_create_from_block_waiver(%{
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
        Notification.get_or_create_from_block_waiver(%{
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
        Notification.get_or_create_from_block_waiver(%{
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
        Notification.get_or_create_from_block_waiver(%{
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
        Notification.get_or_create_from_block_waiver(%{
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
        Notification.get_or_create_from_block_waiver(%{
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
        Notification.get_or_create_from_block_waiver(%{
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
        Notification.get_or_create_from_block_waiver(%{
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
        Notification.get_or_create_from_block_waiver(%{
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
        Notification.get_or_create_from_block_waiver(%{
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

      # Due to the blackout logic in get_or_create_from_bridge_movement, we
      # have to rig the inserted_at timestamps of these bridge movements for
      # the test to work the way we would expect.

      bridge_lowered_unexpired =
        Notification.get_or_create_from_bridge_movement(%{
          status: :lowered,
          lowering_time: nil,
          created_at: baseline_time - eight_hours + 1234
        })

      Skate.Repo.query!(
        "UPDATE bridge_movements SET inserted_at = inserted_at - interval '1 hour'"
      )

      filled_in_bridge_lowered_unexpired = %Notification{
        bridge_lowered_unexpired
        | start_time: baseline_time - eight_hours + 1234,
          end_time: baseline_time + 1234,
          reason: :chelsea_st_bridge_lowered,
          route_ids: @chelsea_st_bridge_route_ids,
          run_ids: [],
          trip_ids: []
      }

      _bridge_lowered_expired =
        Notification.get_or_create_from_bridge_movement(%{
          status: :lowered,
          lowering_time: nil,
          created_at: baseline_time - eight_hours
        })

      Skate.Repo.query!(
        "UPDATE bridge_movements SET inserted_at = inserted_at - interval '1 hour'"
      )

      bridge_raised_unexpired =
        Notification.get_or_create_from_bridge_movement(%{
          status: :raised,
          lowering_time: baseline_time - eight_hours + 999,
          created_at: baseline_time - eight_hours + 2
        })

      Skate.Repo.query!(
        "UPDATE bridge_movements SET inserted_at = inserted_at - interval '1 hour'"
      )

      filled_in_bridge_raised_unexpired = %Notification{
        bridge_raised_unexpired
        | start_time: baseline_time - eight_hours + 2,
          end_time: baseline_time - eight_hours + 999,
          reason: :chelsea_st_bridge_raised,
          route_ids: @chelsea_st_bridge_route_ids,
          run_ids: [],
          trip_ids: []
      }

      _bridge_raised_expired =
        Notification.get_or_create_from_bridge_movement(%{
          status: :raised,
          lowering_time: nil,
          created_at: baseline_time - eight_hours
        })

      assert Skate.Repo.aggregate(DbNotification, :count) == 14

      user1_notifications =
        Notification.unexpired_notifications_for_user("user1", now_fn) |> Enum.sort_by(& &1.id)

      user2_notifications =
        Notification.unexpired_notifications_for_user("user2", now_fn) |> Enum.sort_by(& &1.id)

      assert user1_notifications ==
               [
                 route_1_unexpired,
                 multiroute_unexpired,
                 route_2_unexpired,
                 filled_in_bridge_lowered_unexpired,
                 filled_in_bridge_raised_unexpired
               ]
               |> Enum.map(&%Notification{&1 | state: :unread})
               |> Enum.sort_by(& &1.id)

      assert user2_notifications ==
               [
                 route_1_unexpired,
                 route_3_unexpired,
                 multiroute_unexpired,
                 filled_in_bridge_lowered_unexpired,
                 filled_in_bridge_raised_unexpired
               ]
               |> Enum.map(&%Notification{&1 | state: :unread})
               |> Enum.sort_by(& &1.id)
    end
  end
end
