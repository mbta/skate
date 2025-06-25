defmodule Notifications.NotificationTest do
  require Test.Support.Helpers
  use Skate.DataCase
  import ExUnit.CaptureLog

  doctest Notifications.Notification

  import Skate.Factory

  alias Notifications.Notification
  alias Notifications.Db.Notification, as: DbNotification
  alias Notifications.Db.NotificationUser, as: DbNotificationUser
  alias Skate.Settings.RouteTab
  alias Skate.Settings.User

  import Ecto.Query

  describe "get_or_create_from_block_waiver/1" do
    setup do
      user1 = User.upsert("user1", "user1@test.com")
      user2 = User.upsert("user2", "user2@test.com")
      user3 = User.upsert("user3", "user3@test.com")
      {:ok, %{user1: user1, user2: user2, user3: user3}}
    end

    test "associates a new notification with users subscribed to an affected route", %{
      user1: user1,
      user2: user2,
      user3: user3
    } do
      route_tab1 =
        build(:route_tab, %{
          preset_name: "some routes",
          selected_route_ids: ["4", "1"]
        })

      RouteTab.update_all_for_user!(user1.id, [route_tab1])

      route_tab2 =
        build(:route_tab, %{
          preset_name: "some routes",
          selected_route_ids: ["2"]
        })

      RouteTab.update_all_for_user!(user2.id, [route_tab2])

      route_tab3 =
        build(:route_tab, %{
          preset_name: "some routes",
          selected_route_ids: ["4", "5", "6", "7"]
        })

      RouteTab.update_all_for_user!(user3.id, [route_tab3])

      notification_values = %{
        created_at: 12_345,
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
          Enum.sort([user1.id, user2.id])
      )
    end
  end

  describe "unexpired_notifications_for_user/2" do
    setup do
      user1 = User.upsert("user1", "user1@test.com")
      user2 = User.upsert("user2", "user2@test.com")
      user3 = User.upsert("user3", "user3@test.com")
      {:ok, %{user1: user1, user2: user2, user3: user3}}
    end

    test "returns all unexpired notifications for the given user, in chronological order by creation timestamp",
         %{user1: user1, user2: user2} do
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

      RouteTab.update_all_for_user!(user1.id, [route_tab1])

      route_tab2 =
        build(:route_tab, %{
          preset_name: "some routes",
          selected_route_ids: ["1", "3", "743"]
        })

      RouteTab.update_all_for_user!(user2.id, [route_tab2])

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
          end_time: 10_000
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

      filled_in_bridge_lowered_unexpired =
        Kernel.update_in(
          bridge_lowered_unexpired.content.inserted_at,
          &NaiveDateTime.add(&1, -3, :hour)
        )

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

      filled_in_bridge_raised_unexpired =
        Kernel.update_in(
          bridge_raised_unexpired.content.inserted_at,
          &NaiveDateTime.add(&1, -1, :hour)
        )

      _bridge_raised_expired =
        Notification.get_or_create_from_bridge_movement(%{
          status: :raised,
          lowering_time: nil,
          created_at: baseline_time - eight_hours
        })

      assert Skate.Repo.aggregate(DbNotification, :count) == 14

      user1_notifications =
        user1.id |> Notification.unexpired_notifications_for_user(now_fn) |> Enum.sort_by(& &1.id)

      user2_notifications =
        user2.id |> Notification.unexpired_notifications_for_user(now_fn) |> Enum.sort_by(& &1.id)

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

  describe "create_activated_detour_notification_from_detour/1" do
    test "inserts new record into the database" do
      count = 3

      # create new notification
      for _ <- 1..count do
        :detour
        |> insert()
        |> Notifications.Notification.create_activated_detour_notification_from_detour()
      end

      # assert it is in the database
      assert count == Skate.Repo.aggregate(Notifications.Db.Detour, :count)
    end

    test "creates an unread notification for all users" do
      number_of_users = 5
      [user | _] = insert_list(number_of_users, :user)

      # create new notification
      detour =
        :detour
        |> insert(
          # don't create a new user and affect the user count
          author: user
        )
        |> Notifications.Notification.create_activated_detour_notification_from_detour()

      detour_notification =
        Notifications.Db.Notification
        |> Skate.Repo.get!(detour.id)
        |> Skate.Repo.preload(:users)

      # assert all users have a notification that is unread
      assert Kernel.length(detour_notification.users) == number_of_users
    end

    test "returns detour information" do
      # create new notification
      %{
        state: %{
          "context" => %{
            "route" => %{
              "name" => route_name
            },
            "routePattern" => %{
              "name" => route_pattern_name,
              "headsign" => headsign
            }
          }
        }
      } =
        detour =
        :detour
        |> build()
        |> with_direction(:inbound)
        |> insert()

      detour_notification =
        Notifications.Notification.create_activated_detour_notification_from_detour(detour)

      # assert fields are set
      assert %Notifications.Notification{
               content: %Notifications.Db.Detour{
                 status: :activated,
                 route: ^route_name,
                 origin: ^route_pattern_name,
                 headsign: ^headsign,
                 direction: "Inbound"
               }
             } = detour_notification
    end

    test "deletes associated detour notifications when detour is deleted" do
      # create new notification and detour
      detour = insert(:detour)

      Notifications.Notification.create_activated_detour_notification_from_detour(detour)

      # assert it is in the database
      assert 1 == Skate.Repo.aggregate(Notifications.Db.Detour, :count)

      Skate.Repo.delete!(detour)

      assert 0 == Skate.Repo.aggregate(Notifications.Db.Detour, :count)
      assert 0 == Skate.Repo.aggregate(Notifications.Db.Notification, :count)
    end
  end

  describe "create_deactivated_detour_notification_from_detour/1" do
    test "inserts new record into the database" do
      count = 3

      # create new notification
      for _ <- 1..count do
        :detour
        |> insert()
        |> Notifications.Notification.create_deactivated_detour_notification_from_detour()
      end

      # assert it is in the database
      assert count == Skate.Repo.aggregate(Notifications.Db.Detour, :count)
    end

    test "creates an unread notification for all users" do
      number_of_users = 5
      [user | _] = insert_list(number_of_users, :user)

      # create new notification
      detour =
        :detour
        |> insert(
          # don't create a new user and affect the user count
          author: user
        )
        |> Notifications.Notification.create_deactivated_detour_notification_from_detour()

      detour_notification =
        Notifications.Db.Notification
        |> Skate.Repo.get!(detour.id)
        |> Skate.Repo.preload(:users)

      # assert all users have a notification that is unread
      assert Kernel.length(detour_notification.users) == number_of_users
    end

    test "returns detour information" do
      # create new notification
      %{
        state: %{
          "context" => %{
            "route" => %{
              "name" => route_name
            },
            "routePattern" => %{
              "name" => route_pattern_name,
              "headsign" => headsign
            }
          }
        }
      } =
        detour =
        :detour
        |> build()
        |> with_direction(:inbound)
        |> insert()

      detour_notification =
        Notifications.Notification.create_deactivated_detour_notification_from_detour(detour)

      # assert fields are set
      assert %Notifications.Notification{
               content: %Notifications.Db.Detour{
                 status: :deactivated,
                 route: ^route_name,
                 origin: ^route_pattern_name,
                 headsign: ^headsign,
                 direction: "Inbound"
               }
             } = detour_notification
    end

    test "deletes associated detour notifications when detour is deleted" do
      # create new notification and detour
      detour = insert(:detour)

      Notifications.Notification.create_deactivated_detour_notification_from_detour(detour)

      # assert it is in the database
      assert 1 == Skate.Repo.aggregate(Notifications.Db.Detour, :count)

      Skate.Repo.delete!(detour)

      assert 0 == Skate.Repo.aggregate(Notifications.Db.Detour, :count)
      assert 0 == Skate.Repo.aggregate(Notifications.Db.Notification, :count)
    end
  end

  describe "create_detour_expiration_notification/2" do
    # note: main tests in doctest

    test "logs info of notification creation" do
      Test.Support.Helpers.set_log_level(:info)

      detour = insert(:detour)

      {{:ok, _}, log_30m} =
        with_log([level: :info], fn ->
          Notifications.Notification.create_detour_expiration_notification(%{
            detour: detour,
            expires_in: Duration.new!(minute: 30),
            estimated_duration: "1 hour",
            notification: %{created_at: 123_456_000}
          })
        end)

      # Log location/MFA
      assert log_30m =~ "mfa=Notifications.Notification.create_detour_expiration_notification"
      # Result of operation
      assert log_30m =~ " result=notification_created"
      # Notification information
      assert log_30m =~ " created_at=1973-11-29T21:20:00Z"
      # Type of notification created
      assert log_30m =~ " type=DetourExpiration"
      # Detour Expiration specific information
      assert log_30m =~ ~s(detour_id=#{detour.id} expires_in=PT30M estimated_duration="1 hour")

      {{:ok, _}, log_0m} =
        with_log([level: :info], fn ->
          Notifications.Notification.create_detour_expiration_notification(%{
            detour: detour,
            expires_in: Duration.new!(minute: 0),
            estimated_duration: "1 hour",
            notification: %{created_at: 123_456_000}
          })
        end)

      # Log location/MFA
      assert log_0m =~ "mfa=Notifications.Notification.create_detour_expiration_notification"
      # Result of operation
      assert log_0m =~ " result=notification_created"
      # Notification information
      assert log_0m =~ " created_at=1973-11-29T21:20:00Z"
      # Type of notification created
      assert log_0m =~ " type=DetourExpiration"
      # Detour Expiration specific information
      assert log_0m =~ ~s'detour_id=#{detour.id} expires_in=PT0S estimated_duration="1 hour"'
    end

    test "logs warning of notification creation error" do
      Test.Support.Helpers.set_log_level(:warning)

      detour = insert(:detour)

      {{:error, %Ecto.Changeset{}}, log} =
        with_log([level: :warning], fn ->
          Notifications.Notification.create_detour_expiration_notification(%{
            detour: detour
          })
        end)

      # Log location/MFA
      assert log =~ "mfa=Notifications.Notification.create_detour_expiration_notification"
      # Error information
      assert log =~ "result=error"
      assert log =~ ~r/error=#Ecto.Changeset<.*>\n/
    end
  end
end
