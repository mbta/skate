defmodule SkateWeb.NotificationsChannel do
  use SkateWeb, :channel

  @impl Phoenix.Channel
  def handle_info({:notification, notification}, socket) do
    if SkateWeb.ChannelAuth.valid_token?(socket) do
      :ok = push(socket, "notification", %{data: notification})
      {:noreply, socket}
    else
      :ok = push(socket, "auth_expired", %{})
      {:stop, :normal, socket}
    end
  end

  @impl true
  def join("notifications", _message, socket) do
    %{id: user_id} = Guardian.Phoenix.Socket.current_resource(socket)

    notification_fetch =
      Application.get_env(
        :skate,
        :unexpired_notifications_for_user,
        &Notifications.Notification.unexpired_notifications_for_user/1
      )

    Notifications.NotificationServer.subscribe(user_id)

    initial_notifications = notification_fetch.(user_id)

    {:ok, %{data: %{initial_notifications: initial_notifications}}, socket}
  end
end
