defmodule Notifications.NotificationServer do
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
    name = Keyword.get(opts, :name, __MODULE__)
    GenServer.start_link(__MODULE__, nil, name: name)
  end

  @spec new_block_waivers(BlockWaiver.block_waivers_by_block_key(), GenServer.server()) :: :ok
  def new_block_waivers(new_waivers_by_block_key, server \\ default_name()) do
    GenServer.cast(server, {:new_block_waivers, new_waivers_by_block_key})
  end

  @spec bridge_movement(Bridge.bridge_movement(), GenServer.server()) :: :ok
  def bridge_movement(bridge_movement, server \\ default_name()) do
    GenServer.cast(server, {:bridge_movement, bridge_movement})
  end

  def subscribe(username, server \\ default_name()) do
    registry_key = GenServer.call(server, :subscribe)

    Registry.register(Notifications.Supervisor.registry_name(), registry_key, username)
    :ok
  end

  # Server

  @impl GenServer
  def init(_) do
    {:ok, nil}
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
      trip_ids = trips |> Enum.map(& &1.id)

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

  defp broadcast(notification, registry_key) do
    Registry.dispatch(Notifications.Supervisor.registry_name(), registry_key, fn entries ->
      usernames = User.usernames_for_route_ids(notification.route_ids)

      Enum.each(entries, fn {pid, username} ->
        if Enum.member?(usernames, username) do
          send(pid, {:notification, notification})
        end
      end)
    end)
  end

  @impl true
  def handle_call(:subscribe, _from, state) do
    registry_key = self()
    {:reply, registry_key, state}
  end
end
