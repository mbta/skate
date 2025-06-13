defmodule Notifications.NotificationServerTest do
  use Skate.DataCase
  import Skate.Factory

  alias Notifications.Notification
  alias Notifications.NotificationServer
  alias Realtime.BlockWaiver

  import ExUnit.CaptureLog, only: [capture_log: 2]
  import Skate.Factory
  import Test.Support.Helpers, only: [reassign_env: 3, set_log_level: 1]

  require Logger

  def setup_server(user_id \\ nil) do
    registry_name = :new_notifications_registry
    start_supervised({Registry, keys: :duplicate, name: registry_name})
    reassign_env(:notifications, :registry, registry_name)

    {:ok, server} = NotificationServer.start_link(name: __MODULE__)

    if user_id do
      NotificationServer.subscribe(user_id, server)
    end

    {:ok, server}
  end

  def assert_n_notifications_in_db(expected_n) do
    assert expected_n == Skate.Repo.aggregate(Notifications.Db.Notification, :count)
  end

  describe "start_link/1" do
    test "starts up and lives" do
      {:ok, server} = NotificationServer.start_link(name: :start_link)

      Process.sleep(10)

      assert Process.alive?(server)
    end
  end

  describe "broadcast_notification/3" do
    setup do
      {:ok, server} = setup_server()

      %{server: server}
    end

    test "broadcasts to all subscribers if the provided user specification is :all", %{
      server: server
    } do
      Notifications.NotificationServer.subscribe(0, server)
      Notifications.NotificationServer.subscribe(1, server)
      Notifications.NotificationServer.subscribe(2, server)

      id = 1

      Notifications.NotificationServer.broadcast_notification(
        %Notifications.Notification{
          id: id,
          created_at: nil,
          state: nil,
          content: nil
        },
        :all,
        server
      )

      assert_receive {:notification, %Notifications.Notification{id: ^id}}
      assert_receive {:notification, %Notifications.Notification{id: ^id}}
      assert_receive {:notification, %Notifications.Notification{id: ^id}}

      refute_receive {:notification, %Notifications.Notification{id: ^id}}
    end

    test "broadcasts to all subscribers in the provided users list", %{server: server} do
      Notifications.NotificationServer.subscribe(0, server)
      Notifications.NotificationServer.subscribe(1, server)
      Notifications.NotificationServer.subscribe(2, server)

      id = 1

      Notifications.NotificationServer.broadcast_notification(
        %Notifications.Notification{
          id: id,
          created_at: nil,
          state: nil,
          content: nil
        },
        [0, 1],
        server
      )

      assert_receive {:notification, %Notifications.Notification{id: ^id}}
      assert_receive {:notification, %Notifications.Notification{id: ^id}}

      refute_receive {:notification, %Notifications.Notification{id: ^id}}
    end

    test "logs broadcast_to_cluster call", %{server: server} do
      Notifications.NotificationServer.subscribe(0, server)

      id = 1

      set_log_level(:info)

      log =
        capture_log([level: :info], fn ->
          Notifications.NotificationServer.broadcast_notification(
            %Notifications.Notification{
              id: id,
              created_at: nil,
              state: nil,
              content: nil
            },
            [0, 1],
            server
          )

          assert_receive {:notification, %Notifications.Notification{id: ^id}}
        end)

      assert log =~ "mfa=Notifications.NotificationServer.broadcast_to_cluster/3"
      assert log =~ "notification_id=#{id}"
      assert log =~ "nodes=[:nonode@nohost]"
    end

    test "logs broadcast_to_subscribers call", %{server: server} do
      # Subscribe with the same user id twice to test duplicate subscriptions in
      # the log output, where `user_id_count` != `messages_sent`.
      Notifications.NotificationServer.subscribe(0, server)
      Notifications.NotificationServer.subscribe(0, server)
      Notifications.NotificationServer.subscribe(1, server)
      Notifications.NotificationServer.subscribe(2, server)

      log_specific_users_id = 1

      set_log_level(:info)

      log_specific_users =
        capture_log([level: :info], fn ->
          Notifications.NotificationServer.broadcast_notification(
            %Notifications.Notification{
              id: log_specific_users_id,
              created_at: nil,
              state: nil,
              content: nil
            },
            [0, 1],
            server
          )

          # Absorb messages for the 3 matching subscriptions
          for _ <- 1..3 do
            assert_receive {:notification,
                            %Notifications.Notification{id: ^log_specific_users_id}}
          end

          :sys.get_state(server)
        end)

      log_all_users_id = 2

      log_all_users =
        capture_log([level: :info], fn ->
          Notifications.NotificationServer.broadcast_notification(
            %Notifications.Notification{
              id: log_all_users_id,
              created_at: nil,
              state: nil,
              content: nil
            },
            :all,
            server
          )

          # Absorb messages for all 4 subscriptions
          for _ <- 1..4 do
            assert_receive {:notification, %Notifications.Notification{id: ^log_all_users_id}}
          end

          :sys.get_state(server)
        end)

      assert log_specific_users =~
               "mfa=Notifications.NotificationServer.broadcast_to_subscribers/3"

      assert log_specific_users =~
               "notification_id=#{log_specific_users_id} messages_sent=3 total_subscribers=4 user_id_count=2"

      assert log_all_users =~ "mfa=Notifications.NotificationServer.broadcast_to_subscribers/3"

      assert log_all_users =~
               "notification_id=#{log_all_users_id} messages_sent=4 total_subscribers=4 user_match_pattern=all"
    end
  end

  describe "detour_activated/2" do
    setup do
      {:ok, server} = setup_server()

      %{server: server}
    end

    test "saves to database", %{server: server} do
      NotificationServer.subscribe(0, server)

      notification_count = 3
      # create new notification
      for _ <- 1..notification_count do
        %{id: id} =
          detour =
          insert(:detour)

        NotificationServer.detour_activated(detour, server: server)

        assert_receive {:notification, %{content: %{detour_id: ^id}}}
      end

      # assert database contains notification
      assert_n_notifications_in_db(notification_count)
    end

    test "broadcasts to all connected users", %{server: server} do
      NotificationServer.subscribe(0, server)

      notification_count = 3
      # connect users to channel
      for id <- 1..notification_count do
        NotificationServer.subscribe(id, server)
      end

      # create new notification
      %{id: id} =
        detour =
        insert(:detour)

      NotificationServer.detour_activated(detour, server: server)

      # assert channel sends notifications to each user
      for _ <- 1..notification_count do
        assert_receive {:notification,
                        %Notification{
                          content: %Notifications.Db.Detour{status: :activated, detour_id: ^id}
                        }}
      end
    end
  end

  describe "detour_deactivated/2" do
    setup do
      {:ok, server} = setup_server()

      %{server: server}
    end

    test "saves to database", %{server: server} do
      NotificationServer.subscribe(0, server)

      notification_count = 3
      # create new notification
      for _ <- 1..notification_count do
        %{id: id} =
          detour =
          insert(:detour)

        NotificationServer.detour_deactivated(detour, server: server)

        assert_receive {:notification, %{content: %{detour_id: ^id}}}
      end

      # assert database contains notification
      assert_n_notifications_in_db(notification_count)
    end

    test "broadcasts to all connected users", %{server: server} do
      NotificationServer.subscribe(0, server)

      notification_count = 3
      # connect users to channel
      for id <- 1..notification_count do
        NotificationServer.subscribe(id, server)
      end

      # create new notification
      %{id: id} =
        detour =
        insert(:detour)

      NotificationServer.detour_deactivated(detour, server: server)

      # assert channel sends notifications to each user
      for _ <- 1..notification_count do
        assert_receive {:notification,
                        %Notification{
                          content: %Notifications.Db.Detour{status: :deactivated, detour_id: ^id}
                        }}
      end
    end
  end
end
