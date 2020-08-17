defmodule SkateWeb.NotificationsChannel do
  use SkateWeb, :channel

  @impl Phoenix.Channel
  def handle_info({:notification, message}, socket) do
    valid_token? =
      Application.get_env(:skate, :valid_token?, &SkateWeb.ChannelAuth.valid_token?/1)

    if valid_token?.(socket) do
      IO.inspect(message, label: "NOTIFICATION MESSAGE")
      :ok = push(socket, "notification", %{data: message})
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

  #  def join("notifications:lobby", payload, socket) do
  #    if authorized?(payload) do
  #      {:ok, socket}
  #    else
  #      {:error, %{reason: "unauthorized"}}
  #    end
  #  end
  #
  #  # Channels can be used in a request/response fashion
  #  # by sending replies to requests from the client
  #  def handle_in("ping", payload, socket) do
  #    {:reply, {:ok, payload}, socket}
  #  end
  #
  #  # It is also common to receive messages from the client and
  #  # broadcast to everyone in the current topic (notifications:lobby).
  #  def handle_in("shout", payload, socket) do
  #    broadcast socket, "shout", payload
  #    {:noreply, socket}
  #  end
  #
  #  # Add authorization logic here as required.
  #  defp authorized?(_payload) do
  #    true
  #  end
end
