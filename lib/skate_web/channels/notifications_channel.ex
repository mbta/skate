defmodule SkateWeb.NotificationsChannel do
  @moduledoc false

  use SkateWeb, :channel
  use SkateWeb.AuthenticatedChannel

  @impl SkateWeb.AuthenticatedChannel
  def handle_info_authenticated({:notification, notification}, socket) do
    :ok = push(socket, "notification", %{data: notification})
    {:noreply, socket}
  end

  @impl SkateWeb.AuthenticatedChannel
  def join_authenticated("notifications", _message, socket) do
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
