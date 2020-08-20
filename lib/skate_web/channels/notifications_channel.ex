defmodule SkateWeb.NotificationsChannel do
  use SkateWeb, :channel

  @impl Phoenix.Channel
  def handle_info({:notifications, notifications}, socket) do
    valid_token? =
      Application.get_env(:skate, :valid_token?, &SkateWeb.ChannelAuth.valid_token?/1)

    if valid_token?.(socket) do
      :ok = push(socket, "notifications", %{data: notifications})
      {:noreply, socket}
    else
      :ok = push(socket, "auth_expired", %{})
      {:stop, :normal, socket}
    end
  end

  @impl true
  def join("notifications", _message, socket) do
    Notifications.NotificationServer.subscribe()
    {:ok, socket}
  end
end
