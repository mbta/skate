defmodule Notifications.NotificationServer do
  @moduledoc """
  GenServer which manages a realtime Notifications "PubSub".

  It receives new messages via functions like `new_block_waivers/2` and manages
  new subscribers via `subscribe/2`.
  """

  use GenServer

  alias Notifications.Bridge
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

  @spec new_block_waivers(BlockWaiver.block_waivers_by_block_key(), GenServer.server()) :: :ok
  def new_block_waivers(new_waivers_by_block_key, server \\ default_name()) do
    GenServer.cast(server, {:new_block_waivers, new_waivers_by_block_key})
  end

  @spec bridge_movement(Bridge.bridge_movement(), GenServer.server()) :: :ok
  def bridge_movement(bridge_movement, server \\ default_name()) do
    GenServer.cast(server, {:bridge_movement, bridge_movement})
  end

  @doc """
  Creates a new Detour Activated Notification for a `Skate.Detours.Db.Detour`.

  ## Options

  If the `:server` option is present, the notification is sent to the process
  referred to by the `:server` value.

  If the `:notify_finished` option is present, a `{:new_notification, detour: detour.id}` message
  is sent to the process referred to by the `:notify_finished` value.
  This option has mainly been useful for testing code to avoid `Process.sleep()` calls.
  """
  @spec detour_activated(detour :: Skate.Detours.Db.Detour.t(), keyword()) :: :ok
  def detour_activated(
        %Skate.Detours.Db.Detour{} = detour,
        options \\ []
      ) do
    server = Keyword.get(options, :server, default_name())
    notify_finished = Keyword.get(options, :notify_finished, nil)

    GenServer.cast(server, {:detour_activated, detour, notify_finished})
  end

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

  @impl true
  def handle_cast({:new_block_waivers, new_block_waivers_by_block_key}, state) do
    new_block_waivers_by_block_key
    |> convert_new_block_waivers_to_notifications()
    |> Enum.each(fn new_notification ->
      broadcast(new_notification, self())
    end)

    {:noreply, state}
  end

  @impl true
  def handle_cast({:bridge_movement, bridge_movement}, state) do
    bridge_movement
    |> convert_bridge_movement_to_notification
    |> broadcast(self())

    {:noreply, state}
  end

  @impl true
  def handle_cast(
        {
          :detour_activated,
          %Skate.Detours.Db.Detour{id: id} = detour,
          notify_finished_caller_id
        },
        state
      ) do
    notification =
      Notifications.Notification.create_activated_detour_notification_from_detour(detour)

    broadcast(notification, self())

    notify_caller_new_notification(notify_finished_caller_id, detour: id)
    # Send to processes with same name on other nodes
    broadcast_notification_to_other_instances(notification, state.name)

    {:noreply, state}
  end

  @impl true
  # "Private" method for fetching and sending notifications from distributed
  # Elixir
  def handle_cast(
        {
          :broadcast_new_detour_notification,
          notification_id
        },
        state
      ) do
    notification_id
    |> Notifications.Notification.get_detour_notification()
    |> broadcast(self())

    {:noreply, state}
  end

  # Tell the caller when a notification is created
  # Mainly useful for writing tests so that they don't require
  # `Process.sleep(<N>)`
  defp notify_caller_new_notification(nil = _caller_id, _value), do: nil

  defp notify_caller_new_notification(caller_id, value) do
    send(caller_id, {:new_notification, value})
  end

  defp broadcast_notification_to_other_instances(
         %Notifications.Notification{
           id: notification_id,
           content: %Notifications.Db.Detour{}
         },
         server
       )
       when not is_nil(notification_id) do
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
    for node <- Node.list() do
      GenServer.cast({server, node}, {:broadcast_new_detour_notification, notification_id})
    end
  end

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

  defp convert_bridge_movement_to_notification(bridge_movement) do
    bridge_movement
    |> get_db_values_from_bridge_movement
    |> Notification.get_or_create_from_bridge_movement()
  end

  @spec get_db_values_from_bridge_movement(Bridge.bridge_movement()) ::
          %{status: :raised, lowering_time: integer()} | %{status: :lowered, lowering_time: nil}
  defp get_db_values_from_bridge_movement({bridge_status, lowering_time}) do
    %{status: bridge_status, lowering_time: lowering_time}
  end

  @chelsea_bridge_route_ids [
    "112",
    # 743 is the SL3
    "743"
  ]
  defp broadcast(
         %Notifications.Notification{content: %Notifications.Db.BridgeMovement{}} = notification,
         registry_key
       ) do
    broadcast(notification, User.user_ids_for_route_ids(@chelsea_bridge_route_ids), registry_key)
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

  defp default_unread(%Notifications.Notification{state: nil} = notification),
    do: %{notification | state: :unread}

  defp default_unread(%Notifications.Notification{} = notification),
    do: notification

  @impl true
  def handle_call(:subscribe, _from, state) do
    registry_key = self()
    {:reply, registry_key, state}
  end
end
