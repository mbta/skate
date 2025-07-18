defmodule Notifications.NotificationServer do
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


  ## Contradictions
  While the above describes how `broadcast_notification/3` works, and
  broadly how the PubSub is implemented, `Notifications.NotificationServer`
  has other functions such as

    - `new_block_waivers/2`
    - `bridge_movement/2`
    - `detour_deactivated/2`
    - `detour_activated/2`

  These functions are being deprecated and moved into `Notifications.Notification`
  because they blur the line of what `Notifications.NotificationServer`
  is responsible for. These functions currently manage _creating_
  notifications by calling corresponding functions in `Notifications.Notification`
  **and** then broadcasting the created notification.

  In context of the original implementation, this made sense at the
  time because a Distributed Erlang cluster was not configured at the
  time, and block waivers and bridge movement notifications needed
  to be broadcasted to all users when the instance became aware of it,
  so informing the `Notifications.NotificationServer` was the correct
  choice.

  This reasoning _**does not**_ apply to detour status notifications,
  the `detour_deactivated/2` and `detour_activated/2` functions exist
  here because they were following the precedent set by block waivers
  and bridge movements.
  """

  use GenServer

  require Logger

  alias Notifications.Notification
  alias Notifications.NotificationReason
  alias Realtime.{BlockWaiver, Ghost, Vehicle}
  alias Schedule.Block
  alias Skate.Settings.User

  # Client
  @spec default_name() :: GenServer.name()
  def default_name(), do: Notifications.NotificationServer

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

  ## Deprecated Interface
  # -----------------------------------------------------------------------------
  @spec new_block_waivers(BlockWaiver.block_waivers_by_block_key(), GenServer.server()) :: :ok
  def new_block_waivers(new_waivers_by_block_key, server \\ default_name()) do
    GenServer.cast(server, {:new_block_waivers, new_waivers_by_block_key})
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

  ## Deprecated Functionality
  # -----------------------------------------------------------------------------
  @impl true
  def handle_cast({:new_block_waivers, new_block_waivers_by_block_key}, state) do
    new_block_waivers_by_block_key
    |> convert_new_block_waivers_to_notifications()
    |> Enum.each(fn new_notification ->
      broadcast(new_notification, self())
    end)

    {:noreply, state}
  end

  ## New Implementation
  # -----------------------------------------------------------------------------
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

  @spec convert_new_block_waivers_to_notifications([BlockWaiver.t()]) :: [
          Notification.t()
        ]
  defp convert_new_block_waivers_to_notifications(new_block_waivers) do
    new_block_waivers
    |> Enum.flat_map(fn {block_key, block_waivers} ->
      Enum.map(
        block_waivers,
        &get_db_values_from_block_waiver(block_key, &1)
      )
    end)
    |> Enum.filter(& &1)
    |> Enum.map(&Notification.get_or_create_from_block_waiver/1)
  end

  @spec get_db_values_from_block_waiver(Block.key(), BlockWaiver.t()) ::
          map() | nil
  defp get_db_values_from_block_waiver(
         {schedule_id, block_id},
         block_waiver
       ) do
    if reason = get_notification_reason(block_waiver) do
      block_fn = Application.get_env(:realtime, :block_fn, &Schedule.block/2)
      block = block_fn.(schedule_id, block_id)

      block_date = Block.date_for_block(block)

      waiver_range = Range.new(block_waiver.start_time, block_waiver.end_time)

      trips =
        block
        |> Block.revenue_trips()
        |> Enum.reject(fn trip ->
          trip_start_timestamp = Util.Time.timestamp_for_time_of_day(trip.start_time, block_date)
          trip_end_timestamp = Util.Time.timestamp_for_time_of_day(trip.end_time, block_date)
          trip_range = Range.new(trip_start_timestamp, trip_end_timestamp)
          Range.disjoint?(trip_range, waiver_range)
        end)

      created_at = Util.Time.now()
      route_ids = trips |> Enum.map(& &1.route_id) |> Enum.uniq()
      run_ids = trips |> Enum.map(& &1.run_id) |> Enum.uniq()
      trip_ids = Enum.map(trips, & &1.id)

      peek_at_vehicles_by_run_ids_fn =
        Application.get_env(
          :realtime,
          :peek_at_vehicles_by_run_ids_fn,
          &Realtime.Server.peek_at_vehicles_by_run_ids/1
        )

      vehicle_or_ghost =
        case peek_at_vehicles_by_run_ids_fn.(run_ids) do
          [v] -> v
          _ -> nil
        end

      {operator_id, operator_name, route_id} =
        case vehicle_or_ghost do
          %Vehicle{} = vehicle ->
            {vehicle.operator_id, vehicle.operator_last_name, vehicle.route_id}

          %Ghost{} = ghost ->
            {nil, nil, ghost.route_id}

          nil ->
            {nil, nil, nil}
        end

      %{
        block_id: block_id,
        service_id: block.service_id,
        reason: reason,
        created_at: created_at,
        route_ids: route_ids,
        run_ids: run_ids,
        trip_ids: trip_ids,
        operator_id: operator_id,
        operator_name: operator_name,
        route_id_at_creation: route_id,
        start_time: block_waiver.start_time,
        end_time: block_waiver.end_time,
        state: :unread
      }
    end
  end

  # See Realtime.BlockWaiver for the full mapping between numeric
  # `cause_id`s and textual `cause_description`s.
  @spec get_notification_reason(BlockWaiver.t()) :: NotificationReason.t() | nil
  defp get_notification_reason(block_waiver) do
    case block_waiver.cause_id do
      1 -> :other
      23 -> :manpower
      25 -> :disabled
      26 -> :diverted
      27 -> :traffic
      28 -> :accident
      30 -> :operator_error
      31 -> :adjusted
      _ -> nil
    end
  end

  defp broadcast(
         %Notifications.Notification{
           content: %Notifications.Db.Detour{}
         } = notification,
         registry_key
       ) do
    n = {:notification, default_unread(notification)}

    Registry.dispatch(Notifications.Supervisor.registry_name(), registry_key, fn entries ->
      for {pid, _user_id} <- entries do
        send(pid, n)
      end
    end)
  end

  defp broadcast(
         %Notifications.Notification{
           content: %Notifications.Db.BlockWaiver{
             route_ids: route_ids
           }
         } = notification,
         registry_key
       ) do
    broadcast(notification, User.user_ids_for_route_ids(route_ids), registry_key)
  end

  defp broadcast(
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
      fn entries ->
        for(
          {pid, user_id} <- entries,
          Enum.member?(user_ids, user_id),
          do: send(pid, payload)
        )
      end
    )
  end
end
