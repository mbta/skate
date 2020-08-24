defmodule Notifications.NotificationServer do
  use GenServer

  alias Notifications.Notification
  alias Realtime.BlockWaiver
  alias Schedule.Block

  require Logger

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

  def subscribe(server \\ default_name()) do
    registry_key = GenServer.call(server, :subscribe)

    Registry.register(Notifications.Supervisor.registry_name(), registry_key, :dummy_value)
    :ok
  end

  # Server

  @impl GenServer
  def init(_) do
    {:ok, nil}
  end

  @impl true
  def handle_cast({:new_block_waivers, new_block_waivers_by_block_key}, state) do
    new_notifications =
      new_block_waivers_by_block_key
      |> convert_new_block_waivers_to_notifications()

    if !Enum.empty?(new_notifications) do
      Logger.warn(
        "NotificationServer created new notifications new_notifications=#{
          inspect(new_notifications)
        }"
      )

      broadcast(new_notifications, self())
    end

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
        &convert_block_waiver_to_notification(block_key, &1)
      )
    end)
    |> Enum.filter(& &1)
  end

  @spec convert_block_waiver_to_notification(Block.key(), BlockWaiver.t()) ::
          Notification.t() | nil
  defp convert_block_waiver_to_notification(
         {block_id, service_id},
         block_waiver
       ) do
    if reason = get_notification_reason(block_waiver) do
      block_fn = Application.get_env(:realtime, :block_fn, &Schedule.block/2)

      block = block_fn.(block_id, service_id)

      block_date = Block.date_for_block(block)

      waiver_range = Range.new(block_waiver.start_time, block_waiver.end_time)

      trips =
        Enum.reject(block.trips, fn trip ->
          trip_start_timestamp = Util.Time.timestamp_for_time_of_day(trip.start_time, block_date)
          trip_end_timestamp = Util.Time.timestamp_for_time_of_day(trip.end_time, block_date)
          trip_range = Range.new(trip_start_timestamp, trip_end_timestamp)
          Range.disjoint?(trip_range, waiver_range)
        end)

      created_at = Util.Time.now()
      route_ids = trips |> Enum.map(& &1.route_id) |> Enum.uniq()
      run_ids = trips |> Enum.map(& &1.run_id) |> Enum.uniq()
      trip_ids = trips |> Enum.map(& &1.id)

      %Notification{
        reason: reason,
        created_at: created_at,
        route_ids: route_ids,
        run_ids: run_ids,
        trip_ids: trip_ids
      }
    end
  end

  # See Realtime.BlockWaiver for the full mapping between numeric
  # `cause_id`s and textual `cause_description`s.
  @spec get_notification_reason(BlockWaiver.t()) :: Notification.notification_reason() | nil
  defp get_notification_reason(block_waiver) do
    case block_waiver.cause_id do
      23 -> :manpower
      25 -> :disabled
      26 -> :diverted
      28 -> :accident
      _ -> nil
    end
  end

  defp broadcast(message, registry_key) do
    Registry.dispatch(Notifications.Supervisor.registry_name(), registry_key, fn entries ->
      Enum.each(entries, fn {pid, _} ->
        send(pid, {:notification, message})
      end)
    end)
  end

  @impl true
  def handle_call(:subscribe, _from, state) do
    registry_key = self()
    {:reply, registry_key, state}
  end
end
