defmodule Skate.BlockWaivers do
  @moduledoc """
  Module to convert block waiver information from `Realtime.BlockWaiverStore`
  to `Notifications.Db.BlockWaiver` notifications.
  """

  alias Notifications.NotificationReason
  alias Realtime.{BlockWaiver, Ghost, Vehicle}
  alias Schedule.Block

  def create_block_waiver_notifications(block_waivers) do
    block_waivers
    |> block_waivers_to_changeset_parameters()
    |> Enum.each(&Notifications.Notification.create_block_waiver_notification/1)
  end

  defp block_waivers_to_changeset_parameters(block_waivers) do
    block_waivers
    |> Enum.flat_map(fn {block_key, block_waivers} ->
      Enum.map(
        block_waivers,
        &get_db_values_from_block_waiver(block_key, &1)
      )
    end)
    |> Enum.reject(&is_nil/1)
  end

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
        notification: %{
          created_at: created_at
        },
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
end
