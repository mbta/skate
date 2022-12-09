defmodule SkateWeb.NotificationsChannelTest do
  use SkateWeb.ChannelCase
  import Test.Support.Helpers

  alias Phoenix.Socket
  alias SkateWeb.{NotificationsChannel, UserSocket}

  setup do
    reassign_env(:skate, :valid_token_fn, fn _socket -> true end)

    socket =
      UserSocket
      |> socket("", %{})
      |> Guardian.Phoenix.Socket.put_current_resource(%{id: 1})

    start_supervised({Registry, keys: :duplicate, name: Notifications.Supervisor.registry_name()})

    start_supervised(
      {Notifications.NotificationServer, name: Notifications.NotificationServer.default_name()}
    )

    {:ok, socket: socket}
  end

  describe "join/3" do
    test "subscribes to notifications, returning recent ones", %{
      socket: socket
    } do
      mock_fetch = fn _ -> ["fake notification 1", "fake notification 2"] end
      reassign_env(:skate, :unexpired_notifications_for_user, mock_fetch)

      assert {:ok,
              %{
                data: %{initial_notifications: ["fake notification 1", "fake notification 2"]}
              }, %Socket{}} = subscribe_and_join(socket, NotificationsChannel, "notifications")
    end
  end

  describe "handle_info/2" do
    test "pushes new data onto the socket", %{socket: socket} do
      {:ok, _, socket} = subscribe_and_join(socket, NotificationsChannel, "notifications")

      assert {:noreply, _socket} =
               NotificationsChannel.handle_info(
                 {:notification, "bad thing happen on bus"},
                 socket
               )

      assert_push("notification", %{data: "bad thing happen on bus"})
    end

    test "rejects sending vehicle data when socket is not authenticated", %{socket: socket} do
      reassign_env(:skate, :valid_token_fn, fn _socket -> false end)

      {:ok, _, socket} = subscribe_and_join(socket, NotificationsChannel, "notifications")

      assert {:stop, :normal, _socket} =
               NotificationsChannel.handle_info(
                 {:notification, "bad thing happen on bus"},
                 socket
               )

      assert_push("auth_expired", _)
    end
  end
end
