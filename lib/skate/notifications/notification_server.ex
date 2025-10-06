defmodule Skate.Notifications.NotificationServer do
  @moduledoc """
  `GenServer` which implements a "PubSub" to deliver `Notifications.Notification`'s.

  It receives new messages via `broadcast_notification/3` and manages
  new subscribers via `subscribe/2`.

  ## How it works
  `Notifications.NotificationServer` implements a "PubSub" server across a
  Distributed Erlang cluster using `GenServer` and `Registry`.

  All entries in the `Registry` are stored under the "key" composed of
  `Notifications.NotificationServer`'s GenServer `pid`.

  The `Registry` is configured in `Notifications.Supervisor`.

  ## Subscribing
  When a process calls `subscribe/2`, that process is associated with
  a `Skate.Settings.Db.User`'s ID for filtering when using `Registry`
  as a PubSub via `Registry.dispatch/3`.


  ## Publishing
  When `broadcast_notification/3` is called with a notification, a
  `:broadcast_to_cluster` message is sent to the `Notifications.NotificationServer`
  on that local instance.

  > #### `:broadcast_to_cluster` note
  > {: .info}
  > This first message provides an opportunity for the `Notifications.NotificationServer`
  > to do any necessary pre-processing work, in it's own process from the
  > caller, before proceeding with distributed work across the cluster.

  The `Notifications.NotificationServer` then informs the entire cluster
  to broadcast the provided notification to subscribers. When each
  `Notifications.NotificationServer` instance receives a message, it
  proceeds to `send/2` `{:notification, %Notifications.Notification{}}`
  messages to every process.
  """

  use GenServer

  alias Skate.Notifications

  require Logger

  # Client
  @spec default_name() :: GenServer.name()
  def default_name(), do: Skate.Notifications.NotificationServer

  @spec start_link(Keyword.t()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    opts = Keyword.put_new(opts, :name, default_name())
    GenServer.start_link(__MODULE__, opts, name: opts[:name])
  end

  @doc """
  Broadcasts the argument `notification` to all processes that have subscribed
  via `subscribe/2`.

  If argument `users` is `:all`, broadcasts to all subscribers.

  If argument `users` is a list of `Skate.Settings.Db.User` ID's, subscribers
  with `user_id`'s contained in `users` are notified.
  """
  def broadcast_notification(
        %Notifications.Notification{} = notification,
        users,
        server \\ default_name()
      ) do
    GenServer.cast(server, {:broadcast_to_cluster, notification, users})

    :ok
  end

  @doc """
  Records the calling process as associated with the `user_id` argument to
  subscribe to future notifications.
  """
  def subscribe(user_id, server \\ default_name()) do
    registry_key = GenServer.call(server, :subscribe)

    Registry.register(Notifications.Supervisor.registry_name(), registry_key, user_id)
    :ok
  end

  # Server
  @enforce_keys [:name]
  defstruct [:name]

  @impl GenServer
  def init(opts \\ []) do
    {:ok, struct(__MODULE__, opts)}
  end

  @impl GenServer
  def handle_call(:subscribe, _from, state) do
    registry_key = self()
    {:reply, registry_key, state}
  end

  @impl GenServer
  def handle_cast(
        {:broadcast_to_cluster, %Notifications.Notification{} = notification, users},
        state
      ) do
    broadcast_to_cluster(notification, users, state.name)

    {:noreply, state}
  end

  @impl GenServer
  def handle_cast(
        {:broadcast_to_subscribers, %Notifications.Notification{} = notification, users},
        state
      ) do
    broadcast_to_subscribers(notification, users, self())

    {:noreply, state}
  end

  defp broadcast_to_cluster(%Notifications.Notification{} = notification, users, server_name) do
    # Currently, we've implemented our own "PubSub" for notifications and we
    # are not using the provided `Phoenix.PubSub` that comes with Phoenix
    # channels. This means we don't benefit from Phoenix PubSub's ability to
    # send messages using distributed Elixir, and that we need to implement
    # this ourselves at this current time.
    # Ideally, Notifications would be delivered using
    # `Phoenix.Channel.broadcast` instead of our custom `broadcast` function
    #  in `NotificationServer`. To do this, we'd need to implement the same
    # filtering mechanism that this module has implemented. For now, we'll
    # send messages to other Skate instances letting them know about new
    # Notifications.

    # Skate instances currently do not "specialize", and therefore we need to
    # send the notification to all instances
    nodes = [Node.self()] ++ Node.list()

    Logger.info(
      "broadcasting notification to distributed instances notification_id=#{notification.id} nodes=#{inspect(nodes)}"
    )

    GenServer.abcast(nodes, server_name, {:broadcast_to_subscribers, notification, users})
  end

  defp broadcast_to_subscribers(
         %Notifications.Notification{} = notification,
         user_ids,
         registry_key
       ) do
    # Frontend expects the :status not to be `nil`, and when broadcasting, the
    # broadcasted notification is new and therefore unread.
    payload = {:notification, default_unread(notification)}

    Registry.dispatch(
      Notifications.Supervisor.registry_name(),
      registry_key,
      fn entities ->
        messages_sent =
          entities
          |> filter_entities(user_ids)
          |> Enum.map(fn {pid, _user_id} ->
            send(pid, payload)
            :ok
          end)
          |> Enum.count()

        Logger.info(fn ->
          "sent notification to subscribers" <>
            " notification_id=#{notification.id}" <>
            " messages_sent=#{messages_sent}" <>
            " total_subscribers=#{Enum.count(entities)}" <>
            case user_ids do
              :all -> " user_match_pattern=#{user_ids}"
              user_ids when is_list(user_ids) -> " user_id_count=#{length(user_ids)}"
            end
        end)
      end
    )
  end

  defp filter_entities(enumerable, :all) do
    enumerable
  end

  defp filter_entities(_enumerable, [] = _user_ids) do
    []
  end

  defp filter_entities(enumerable, user_ids) when is_list(user_ids) do
    Enum.filter(enumerable, fn {_pid, user_id} -> Enum.member?(user_ids, user_id) end)
  end

  defp default_unread(%Notifications.Notification{state: nil} = notification),
    do: %{notification | state: :unread}

  defp default_unread(%Notifications.Notification{} = notification),
    do: notification
end
