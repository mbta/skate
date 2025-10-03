defmodule Notifications.NotificationServer do
  @moduledoc """
  `GenServer` which implements a "PubSub" to deliver `Notifications.Notification`'s.

  This version uses `Phoenix.PubSub` for broadcasting notifications.
  """

  use GenServer

  require Logger

  alias Phoenix.PubSub
  alias Notifications.NotificationDispatcher

  # Client
  @spec default_name() :: GenServer.name()
  def default_name(), do: Notifications.NotificationServer

  @spec start_link(Keyword.t()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    opts = Keyword.put_new(opts, :name, default_name())
    opts = Keyword.put_new(opts, :pubsub_name, Notifications.PubSub)
    GenServer.start_link(__MODULE__, opts, name: opts[:name])
  end

  @doc """
  Broadcasts the argument `notification` to all processes that have subscribed
  via `Phoenix.PubSub`.

  If argument `users` is `:all`, broadcasts to all subscribers.

  If argument `users` is a list of `Skate.Settings.Db.User` ID's, the notification
  is broadcast with the user filtering handled server-side.
  """
  def broadcast_notification(
        %Notifications.Notification{} = notification,
        users,
        server \\ default_name()
      ) do
    GenServer.cast(server, {:broadcast_to_subscribers, notification, users})
    :ok
  end

  @doc """
  Subscribes the calling process to notifications for the given `user_id`.
  """
  def subscribe(user_id, pubsub_name \\ Notifications.PubSub) do
    PubSub.subscribe(pubsub_name, "notifications:all", metadata: %{user_id: user_id})
    :ok
  end

  # Server
  @enforce_keys [:name, :pubsub_name]
  defstruct [:name, :pubsub_name]

  @impl GenServer
  def init(opts \\ []) do
    state = struct(__MODULE__, opts)
    {:ok, state}
  end

  @impl GenServer
  def handle_cast(
        {:broadcast_to_subscribers, %Notifications.Notification{} = notification, users},
        state
      ) do
    broadcast_to_subscribers(notification, users, state.pubsub_name)
    {:noreply, state}
  end

  defp broadcast_to_subscribers(
         %Notifications.Notification{} = notification,
         user_ids,
         pubsub_name
       ) do
    payload = {user_ids, {:notification, default_unread(notification)}}

    PubSub.broadcast(pubsub_name, "notifications:all", payload, NotificationDispatcher)
  end

  defp default_unread(%Notifications.Notification{state: nil} = notification),
    do: %{notification | state: :unread}

  defp default_unread(%Notifications.Notification{} = notification),
    do: notification
end
