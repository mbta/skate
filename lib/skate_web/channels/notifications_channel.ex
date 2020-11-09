defmodule SkateWeb.NotificationsChannel do
  use SkateWeb, :channel

  @impl Phoenix.Channel
  def handle_info({:notification, notification}, socket) do
    valid_token? =
      Application.get_env(:skate, :valid_token?, &SkateWeb.ChannelAuth.valid_token?/1)

    if valid_token?.(socket) do
      :ok = push(socket, "notification", %{data: notification})
      {:noreply, socket}
    else
      :ok = push(socket, "auth_expired", %{})
      {:stop, :normal, socket}
    end
  end

  @impl true
  def join("notifications", _message, socket) do
    username_from_socket! =
      Application.get_env(
        :skate,
        :username_from_socket!,
        &SkateWeb.AuthManager.username_from_socket!/1
      )

    username = username_from_socket!.(socket)
    Notifications.NotificationServer.subscribe(username)
    {:ok, socket}
  end
end
