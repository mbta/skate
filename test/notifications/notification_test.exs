defmodule Notifications.NotificationTest do
  require Test.Support.Helpers
  use Skate.DataCase
  import ExUnit.CaptureLog

  doctest Notifications.Notification

  import Skate.Factory

  alias Notifications.Notification
  alias Notifications.Db.Notification, as: DbNotification
  alias Skate.Settings.RouteTab
  alias Skate.Settings.User

  describe "unexpired_notifications_for_user/2" do
    setup do
      user1 = User.upsert("user1", "user1@test.com")
      user2 = User.upsert("user2", "user2@test.com")
      user3 = User.upsert("user3", "user3@test.com")
      {:ok, %{user1: user1, user2: user2, user3: user3}}
    end

    test "returns all unexpired notifications for the given user, in chronological order by creation timestamp",
         %{user1: user1, user2: user2} do
      eight_hours = 8 * 60 * 60
      baseline_time = 1_000_000_000 + eight_hours
      now_fn = fn -> baseline_time end

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

      {:ok, route_1_unexpired} =
        Notification.create_block_waiver_notification(%{
          block_id: "block",
          service_id: "service",
          reason: :other,
          run_ids: [],
          trip_ids: [],
          start_time: 0,
          created_at: baseline_time - eight_hours + 10,
          notification: %{created_at: baseline_time - eight_hours + 10},
          route_ids: ["1"],
          end_time: 10_000
        })

      route_1_unexpired =
        Notifications.Notification.get_domain_notification(route_1_unexpired.notification.id)

      _route_1_expired =
        Notification.create_block_waiver_notification(%{
          block_id: "block",
          service_id: "service",
          reason: :other,
          run_ids: [],
          trip_ids: [],
          start_time: 1,
          created_at: baseline_time - eight_hours,
          notification: %{created_at: baseline_time - eight_hours},
          route_ids: ["1"],
          end_time: 2
        })

      {:ok, route_2_unexpired} =
        Notification.create_block_waiver_notification(%{
          block_id: "block",
          service_id: "service",
          reason: :other,
          run_ids: [],
          trip_ids: [],
          start_time: 4,
          created_at: baseline_time - eight_hours + 1,
          notification: %{created_at: baseline_time - eight_hours + 1},
          route_ids: ["2"],
          end_time: 5000
        })

      route_2_unexpired =
        Notifications.Notification.get_domain_notification(route_2_unexpired.notification.id)

      _route_2_expired =
        Notification.create_block_waiver_notification(%{
          block_id: "block",
          service_id: "service",
          reason: :other,
          run_ids: [],
          trip_ids: [],
          start_time: 6,
          created_at: baseline_time - eight_hours,
          notification: %{created_at: baseline_time - eight_hours},
          route_ids: ["2"],
          end_time: 7
        })

      {:ok, route_3_unexpired} =
        Notification.create_block_waiver_notification(%{
          block_id: "block",
          service_id: "service",
          reason: :other,
          run_ids: [],
          trip_ids: [],
          start_time: 8,
          created_at: baseline_time - eight_hours + 5,
          notification: %{created_at: baseline_time - eight_hours + 5},
          route_ids: ["3"],
          end_time: 9000
        })

      route_3_unexpired =
        Notifications.Notification.get_domain_notification(route_3_unexpired.notification.id)

      _route_3_expired =
        Notification.create_block_waiver_notification(%{
          block_id: "block",
          service_id: "service",
          reason: :other,
          run_ids: [],
          trip_ids: [],
          start_time: 10,
          created_at: baseline_time - eight_hours,
          notification: %{created_at: baseline_time - eight_hours},
          route_ids: ["3"],
          end_time: 11
        })

      {:ok, multiroute_unexpired} =
        Notification.create_block_waiver_notification(%{
          block_id: "block",
          service_id: "service",
          reason: :other,
          run_ids: [],
          trip_ids: [],
          start_time: 12,
          created_at: baseline_time - eight_hours + 3,
          notification: %{created_at: baseline_time - eight_hours + 3},
          route_ids: ["2", "3"],
          end_time: 8000
        })

      multiroute_unexpired =
        Notifications.Notification.get_domain_notification(multiroute_unexpired.notification.id)

      _multiroute_expired =
        Notification.create_block_waiver_notification(%{
          block_id: "block",
          service_id: "service",
          reason: :other,
          run_ids: [],
          trip_ids: [],
          start_time: 14,
          created_at: baseline_time - eight_hours,
          notification: %{created_at: baseline_time - eight_hours},
          route_ids: ["2", "3"],
          end_time: 15
        })

      _route_4_unexpired =
        Notification.create_block_waiver_notification(%{
          block_id: "block",
          service_id: "service",
          reason: :other,
          run_ids: [],
          trip_ids: [],
          start_time: 16,
          created_at: baseline_time - eight_hours + 3,
          notification: %{created_at: baseline_time - eight_hours + 3},
          route_ids: ["4"],
          end_time: 17
        })

      _route_4_expired =
        Notification.create_block_waiver_notification(%{
          block_id: "block",
          service_id: "service",
          reason: :other,
          run_ids: [],
          trip_ids: [],
          start_time: 18,
          created_at: baseline_time - eight_hours,
          notification: %{created_at: baseline_time - eight_hours},
          route_ids: ["4"],
          end_time: 19
        })

      # Due to the blackout logic in maybe_record_bridge_status, we
      # have to rig the inserted_at timestamps of these bridge movements for
      # the test to work the way we would expect.
      now = DateTime.utc_now()

      {:ok, %{notification: %{id: bridge_lowered_unexpired_id}}} =
        Skate.BridgeStatus.maybe_record_bridge_status(%{
          status: :lowered,
          inserted_at: DateTime.shift(now, hour: -3)
        })

      # Expired
      {:ok, _} =
        Skate.BridgeStatus.maybe_record_bridge_status(%{
          status: :lowered,
          inserted_at: DateTime.shift(now, hour: -2),
          notification: %{created_at: baseline_time - eight_hours}
        })

      {:ok, %{notification: %{id: bridge_raised_unexpired_id}}} =
        Skate.BridgeStatus.maybe_record_bridge_status(%{
          status: :raised,
          lowering_time: baseline_time - eight_hours + 999,
          inserted_at: DateTime.shift(now, hour: -1)
        })

      # Expired
      {:ok, _} =
        Skate.BridgeStatus.maybe_record_bridge_status(%{
          status: :raised,
          inserted_at: now,
          notification: %{created_at: baseline_time - eight_hours}
        })

      assert Skate.Repo.aggregate(DbNotification, :count) == 14

      user1_notifications =
        user1.id |> Notification.unexpired_notifications_for_user(now_fn) |> Enum.sort_by(& &1.id)

      user2_notifications =
        user2.id |> Notification.unexpired_notifications_for_user(now_fn) |> Enum.sort_by(& &1.id)

      filled_in_bridge_lowered_unexpired =
        Notifications.Notification.get_domain_notification(bridge_lowered_unexpired_id)

      filled_in_bridge_raised_unexpired =
        Notifications.Notification.get_domain_notification(bridge_raised_unexpired_id)

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
      {:ok, %{notification: %{id: notification_id}}} =
        :detour
        |> insert(
          # don't create a new user and affect the user count
          author: user
        )
        |> Notifications.Notification.create_activated_detour_notification_from_detour()

      detour_notification =
        Notifications.Db.Notification
        |> Skate.Repo.get!(notification_id)
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

      {:ok, %{notification: %{id: notification_id}}} =
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
             } = Notifications.Notification.get_domain_notification(notification_id)
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

    test "logs notification creation" do
      Test.Support.Helpers.set_log_level(:info)

      {{:ok, %{detour_id: detour_id, notification: %{created_at: created_at}}}, log} =
        with_log([level: :info], fn ->
          :detour
          |> insert()
          |> Notifications.Notification.create_activated_detour_notification_from_detour()
        end)

      # Log location/MFA
      assert log =~
               "mfa=Notifications.Notification.create_activated_detour_notification_from_detour"

      # Result of operation
      assert log =~ " result=notification_created"
      # Notification information
      assert log =~ " created_at=#{created_at |> DateTime.from_unix!() |> DateTime.to_iso8601()}"
      # Type of notification created
      assert log =~ " type=DetourStatus"
      # Detour Activated Status information
      assert log =~ "detour_id=#{detour_id} status=activated"
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
      {:ok, %{notification: %{id: notification_id}}} =
        :detour
        |> insert(
          # don't create a new user and affect the user count
          author: user
        )
        |> Notifications.Notification.create_deactivated_detour_notification_from_detour()

      detour_notification =
        Notifications.Db.Notification
        |> Skate.Repo.get!(notification_id)
        |> Skate.Repo.preload(:users)

      # assert all users have a notification that is unread
      assert Kernel.length(detour_notification.users) == number_of_users
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

    test "logs notification creation" do
      Test.Support.Helpers.set_log_level(:info)

      {{:ok, %{detour_id: detour_id, notification: %{created_at: created_at}}}, log} =
        with_log([level: :info], fn ->
          :detour
          |> insert()
          |> Notifications.Notification.create_deactivated_detour_notification_from_detour()
        end)

      # Log location/MFA
      assert log =~
               "mfa=Notifications.Notification.create_deactivated_detour_notification_from_detour"

      # Result of operation
      assert log =~ " result=notification_created"
      # Notification information
      assert log =~ " created_at=#{created_at |> DateTime.from_unix!() |> DateTime.to_iso8601()}"
      # Type of notification created
      assert log =~ " type=DetourStatus"
      # Detour Expiration specific information
      assert log =~ "detour_id=#{detour_id} status=deactivated"
    end
  end

  describe "create_bridge_movement_notification/2" do
    test "creates new bridge movement record and associated notification" do
      {:ok, %Notifications.Db.BridgeMovement{notification: %Notifications.Db.Notification{}}} =
        Notifications.Notification.create_bridge_movement_notification(%{
          status: :lowered
        })

      {:ok, %Notifications.Db.BridgeMovement{notification: %Notifications.Db.Notification{}}} =
        Notifications.Notification.create_bridge_movement_notification(%{
          status: :raised
        })
    end

    test "creates unread notifications for users with affected route ids" do
      test_users =
        insert_list(3, :user,
          route_tabs: fn -> build_list(1, :db_route_tab, selected_route_ids: ["1"]) end
        )

      assert {:ok, %{notification: %{users: users}}} =
               Notifications.Notification.create_bridge_movement_notification(%{
                 status: :lowered,
                 bridge_route_ids: ["1"]
               })

      assert Enum.map(test_users, & &1.id) ==
               users |> Enum.map(& &1.id) |> Enum.sort(:asc)
    end

    test "logs info of notification creation" do
      Test.Support.Helpers.set_log_level(:info)

      {{:ok, _}, log_lowered} =
        with_log([level: :info], fn ->
          Notifications.Notification.create_bridge_movement_notification(%{
            status: :lowered,
            notification: %{created_at: DateTime.to_unix(~U[2025-01-01 12:34:56Z])}
          })
        end)

      # Log location/MFA
      assert log_lowered =~ "mfa=Notifications.Notification.create_bridge_movement_notification"
      # Result of operation
      assert log_lowered =~ "result=notification_created"
      # Notification information
      assert log_lowered =~ "created_at=2025-01-01T12:34:56Z"
      # Type of notification created
      assert log_lowered =~ "type=BridgeMovement"
      # Bridge Movement specific information
      assert log_lowered =~ "status=lowered lowering_time=nil"

      {{:ok, _}, log_raised} =
        with_log([level: :info], fn ->
          Notifications.Notification.create_bridge_movement_notification(%{
            status: :raised,
            lowering_time: DateTime.to_unix(~U[2025-01-01 12:34:56Z]),
            notification: %{created_at: DateTime.to_unix(~U[2025-01-01 12:34:56Z])}
          })
        end)

      # Log location/MFA
      assert log_raised =~ "mfa=Notifications.Notification.create_bridge_movement_notification"
      # Result of operation
      assert log_raised =~ "result=notification_created "
      # Notification information
      assert log_raised =~ "created_at=2025-01-01T12:34:56Z "
      # Type of notification created
      assert log_raised =~ "type=BridgeMovement "
      # Bridge Movement specific information
      assert log_raised =~ "status=raised lowering_time=2025-01-01T12:34:56Z"
    end

    test "logs warning of notification creation error" do
      Test.Support.Helpers.set_log_level(:warning)

      {{:error, %Ecto.Changeset{}}, changeset_error} =
        with_log([level: :warning], fn ->
          Notifications.Notification.create_bridge_movement_notification(%{})
        end)

      # Log location/MFA
      assert changeset_error =~
               "mfa=Notifications.Notification.create_bridge_movement_notification"

      # Error information
      assert changeset_error =~ "result=error"
      assert changeset_error =~ ~r/error=#Ecto.Changeset<.*can't be blank.*>\n/
    end
  end

  describe "create_detour_expiration_notification/2" do
    # note: main tests in doctest

    test "creates notifications for all users" do
      users = insert_list(5, :user)

      detour = insert(:detour, author: hd(users))

      assert {:ok, %{notification: notification}} =
               Notification.create_detour_expiration_notification(detour, %{
                 expires_in: Duration.new!(minute: 30),
                 estimated_duration: "1 hour"
               })

      assert ^users =
               notification |> Ecto.assoc(:users) |> Skate.Repo.all() |> Enum.sort_by(& &1.id)
    end

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

  describe "create_block_waiver_notification/1" do
    test "creates notification for users subscribed to an affected route" do
      users =
        insert_list(3, :user,
          route_tabs: fn -> build_list(1, :db_route_tab, selected_route_ids: ["1"]) end
        ) ++
          insert_list(3, :user,
            route_tabs: fn -> build_list(1, :db_route_tab, selected_route_ids: ["2"]) end
          )

      assert {:ok, %{notification: %{users: notification_users}}} =
               Notification.create_block_waiver_notification(%{
                 created_at: Util.Time.now(),
                 reason: :other,
                 route_ids: ["1", "2"],
                 run_ids: [],
                 trip_ids: [],
                 block_id: "block_id",
                 service_id: "service_id",
                 start_time: 0,
                 end_time: 1
               })

      assert users |> Enum.map(& &1.id) |> Enum.sort(:asc) ==
               notification_users |> Enum.map(& &1.id) |> Enum.sort(:asc)
    end

    test "does not creates notification for users not viewing an affected route" do
      insert_list(3, :user,
        route_tabs: fn ->
          build_list(1, :db_route_tab, selected_route_ids: ["1"], ordering: nil)
        end
      )

      insert_list(3, :user,
        route_tabs: fn ->
          build_list(1, :db_route_tab, selected_route_ids: ["2"], ordering: nil)
        end
      )

      insert_list(3, :user,
        route_tabs: fn -> build_list(1, :db_route_tab, selected_route_ids: ["3"], ordering: 0) end
      )

      assert {:ok, %{notification: %{users: notification_users}}} =
               Notification.create_block_waiver_notification(%{
                 created_at: Util.Time.now(),
                 reason: :other,
                 route_ids: ["1", "2"],
                 run_ids: [],
                 trip_ids: [],
                 block_id: "block_id",
                 service_id: "service_id",
                 start_time: 0,
                 end_time: 1
               })

      assert [] ==
               notification_users
    end

    test "does not create duplicate notifications" do
      notification_attrs = %{
        created_at: Util.Time.now(),
        reason: :other,
        route_ids: ["1", "2"],
        run_ids: [],
        trip_ids: [],
        block_id: "block_id",
        service_id: "service_id",
        start_time: 0,
        end_time: 1
      }

      assert {:ok, _} =
               Notification.create_block_waiver_notification(notification_attrs)

      assert {:error, _} =
               Notification.create_block_waiver_notification(notification_attrs)
    end

    test "logs info of notification creation" do
      Test.Support.Helpers.set_log_level(:info)
      created_at = Util.Time.now()

      {{:ok, _}, log} =
        with_log([level: :info], fn ->
          Notifications.Notification.create_block_waiver_notification(%{
            created_at: created_at,
            notification: %{created_at: created_at},
            reason: :other,
            route_ids: ["1", "2"],
            run_ids: [],
            trip_ids: [],
            block_id: "block_id 1",
            service_id: "service_id 1",
            start_time: 0,
            end_time: 1
          })
        end)

      # Log location/MFA
      assert log =~ "mfa=Notifications.Notification.create_block_waiver_notification"
      # Result of operation
      assert log =~ " result=notification_created"
      # Notification information
      assert log =~ " created_at=#{created_at |> DateTime.from_unix!() |> DateTime.to_iso8601()}"
      # Type of notification created
      assert log =~ " type=BlockWaiver"
      # Detour Expiration specific information
      assert log =~
               ~s( reason=other block_id="block_id 1" service_id="service_id 1" start_time="" end_time="" route_ids="1 2")
    end
  end
end
