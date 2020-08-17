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

      waiver_range = Range.new(block_waiver.start_time, block_waiver.end_time)

      trips =
        Enum.reject(block.trips, fn trip ->
          trip_range = Range.new(trip.start_time, trip.end_time)
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

  @spec get_notification_reason(BlockWaiver.t()) :: Notification.notification_reason() | nil
  defp get_notification_reason(block_waiver) do
    # TODO: Once a list of possible values of BlockWaiver.cause_id is
    # available, match on that rather than the text description.
    #
    case block_waiver.cause_description do
      "B - Manpower" -> :manpower
      "D - Disabled" -> :disabled
      "E - Diverted" -> :diverted
      "G - Accident" -> :accident
      _ -> nil
    end
  end
end
