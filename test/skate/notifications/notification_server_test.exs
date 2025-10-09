defmodule Skate.Notifications.NotificationServerTest do
  use Skate.DataCase
  import Skate.Factory

  alias Skate.Notifications
  alias Skate.Notifications.NotificationServer

  import ExUnit.CaptureLog, only: [capture_log: 2]
  import Skate.Factory
  import Test.Support.Helpers, only: [set_log_level: 1]

  require Logger

  def setup_server(user_id \\ nil) do
    pubsub_name = :notication_server_test_pubsub
    start_supervised({Phoenix.PubSub, name: pubsub_name})

    {:ok, server} =
      NotificationServer.start_link(name: __MODULE__, pubsub_name: pubsub_name)

    if user_id do
      NotificationServer.subscribe(user_id, server)
    end

    %{server: server, pubsub_name: pubsub_name}
  end

  def assert_n_notifications_in_db(expected_n) do
    assert expected_n == Skate.Repo.aggregate(Notifications.Db.Notification, :count)
  end

  describe "start_link/1" do
    test "starts up and lives" do
      pubsub_name = :test_pubsub
      start_supervised({Phoenix.PubSub, name: pubsub_name})

      {:ok, server} =
        NotificationServer.start_link(name: :start_link, pubsub_name: pubsub_name)

      Process.sleep(10)

      assert Process.alive?(server)
    end
  end

  describe "broadcast_notification/3" do
    setup do
      setup_server()
    end

    test "broadcasts to all subscribers if the provided user specification is :all", %{
      server: server,
      pubsub_name: pubsub_name
    } do
      Notifications.NotificationServer.subscribe(0, pubsub_name)
      Notifications.NotificationServer.subscribe(1, pubsub_name)
      Notifications.NotificationServer.subscribe(2, pubsub_name)

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

    test "broadcasts to all subscribers in the provided users list", %{
      server: server,
      pubsub_name: pubsub_name
    } do
      Notifications.NotificationServer.subscribe(0, pubsub_name)
      Notifications.NotificationServer.subscribe(1, pubsub_name)
      Notifications.NotificationServer.subscribe(2, pubsub_name)

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

    test "logs broadcast_to_cluster call", %{server: server, pubsub_name: pubsub_name} do
      Notifications.NotificationServer.subscribe(0, pubsub_name)

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

      assert log =~
               "mfa=Skate.Notifications.NotificationDispatcher.dispatch/3 sent notification to subscribers notification_id=#{id} messages_sent=1 total_subscribers=1 user_id_count=2"
    end

    test "logs broadcast_to_subscribers call", %{server: server, pubsub_name: pubsub_name} do
      Notifications.NotificationServer.subscribe(0, pubsub_name)
      Notifications.NotificationServer.subscribe(0, pubsub_name)
      Notifications.NotificationServer.subscribe(1, pubsub_name)
      Notifications.NotificationServer.subscribe(2, pubsub_name)

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

          assert_receive {:notification, %Notifications.Notification{id: ^log_specific_users_id}}
          assert_receive {:notification, %Notifications.Notification{id: ^log_specific_users_id}}

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

          assert_receive {:notification, %Notifications.Notification{id: ^log_all_users_id}}
          assert_receive {:notification, %Notifications.Notification{id: ^log_all_users_id}}
          assert_receive {:notification, %Notifications.Notification{id: ^log_all_users_id}}

          :sys.get_state(server)
        end)

      assert log_specific_users =~
               "mfa=Skate.Notifications.NotificationDispatcher.dispatch/3"

      assert log_specific_users =~
               "notification_id=#{log_specific_users_id} messages_sent=2 total_subscribers=4 user_id_count=2"

      assert log_all_users =~ "mfa=Skate.Notifications.NotificationDispatcher.dispatch/3"

      assert log_all_users =~
               "notification_id=#{log_all_users_id} messages_sent=3 total_subscribers=4 user_match_pattern=all"
    end
  end

  describe "Notifications.Notification broadcasts notifications when notification is created" do
    setup do
      pubsub_name = :test_pubsub
      start_supervised({Phoenix.PubSub, name: pubsub_name})

      {:ok, server} = NotificationServer.start_link(pubsub_name: pubsub_name)

      %{server: server, pubsub_name: pubsub_name}
    end

    test "create_detour_expiration_notification/3", %{pubsub_name: pubsub_name} do
      users = insert_list(3, :user)

      for %{id: user_id} <- users do
        Notifications.NotificationServer.subscribe(user_id, pubsub_name)
      end

      detour = insert(:detour)

      {:ok, %{notification: %{id: id}}} =
        Notifications.Notification.create_detour_expiration_notification(
          detour,
          %{
            expires_in: Duration.new!(minute: 30),
            estimated_duration: "1 hour"
          }
        )

      for _ <- users do
        assert_receive {:notification, %Notifications.Notification{id: ^id}}
      end
    end
  end
end
