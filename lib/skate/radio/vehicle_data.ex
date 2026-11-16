defmodule Skate.Radio.VehicleData do
  @moduledoc """
  Maps the latest realtime vehicle snapshot to JSON-ready radio display data.

  IDs are exact feed IDs (for example, `"y1714"`), not fleet labels. Missing
  assignments are represented by `nil`, including route ID and name.

  `receivedAt` is the time this mapping is requested, not the GPS observation
  time or the radio event's timestamp. An event handler should replace it with
  the event's receipt time once that contract is defined.

  `garage` describes the assigned block's garage. `currentLocation` is the
  associated stop name, which may be the next stop, not an exact GPS address.
  This is a latest-state lookup, not an event-time or freshness guarantee.
  """

  alias Realtime.{Server, Vehicle}
  alias Schedule.Garage

  require Logger

  @type data :: %{
          required(String.t()) => String.t() | nil
        }

  @doc """
  Returns all radio display fields as string keys, ready for `Jason.encode/1`.

  Returns an explicit error for invalid IDs or vehicles absent from the live
  store (including ghost vehicles), so callers can fail an SQS message for retry.
  Realtime server failures propagate to the caller.
  """
  @spec fetch(String.t()) :: {:ok, data()} | {:error, :vehicle_not_found | :invalid_vehicle_id}
  def fetch(vehicle_id) when is_binary(vehicle_id) and vehicle_id != "" do
    case Server.peek_at_vehicle_by_id(vehicle_id) do
      [%Vehicle{} = vehicle] ->
        {:ok, map_vehicle(vehicle)}

      _ ->
        Logger.warning("Radio vehicle lookup failed: vehicle not found #{inspect(vehicle_id)}")
        {:error, :vehicle_not_found}
    end
  end

  def fetch(vehicle_id) do
    Logger.warning("Radio vehicle lookup failed: invalid vehicle ID #{inspect(vehicle_id)}")
    {:error, :invalid_vehicle_id}
  end

  defp map_vehicle(vehicle) do
    route = vehicle.route_id && Schedule.route_by_id(vehicle.route_id)

    %{
      "routeId" => vehicle.route_id,
      "routeName" => route && route.name,
      "vehicleId" => vehicle.id,
      "garage" => Garage.garage_for_block(vehicle.block_id),
      "receivedAt" => DateTime.to_iso8601(DateTime.utc_now()),
      "direction" => route && route.direction_names[vehicle.direction_id],
      "variant" => variant(vehicle.via_variant),
      "currentLocation" => vehicle.stop_status && vehicle.stop_status.stop_name,
      "operatorBadge" => nonblank(vehicle.operator_id),
      "operatorName" => operator_name(vehicle),
      "runNumber" => nonblank(vehicle.run_id),
      "adherence" => adherence(vehicle)
    }
  end

  defp variant("_"), do: nil
  defp variant(value), do: nonblank(value)

  defp operator_name(vehicle) do
    [vehicle.operator_first_name, vehicle.operator_last_name]
    |> Enum.map(&nonblank/1)
    |> Enum.reject(&is_nil/1)
    |> Enum.join(" ")
    |> nonblank()
  end

  defp nonblank(nil), do: nil

  defp nonblank(value) do
    case String.trim(value) do
      "" -> nil
      trimmed -> trimmed
    end
  end

  defp adherence(%Vehicle{is_off_course: true}), do: nil
  defp adherence(%Vehicle{is_shuttle: true}), do: nil
  defp adherence(%Vehicle{schedule_adherence_secs: nil}), do: nil
  defp adherence(%Vehicle{schedule_adherence_secs: seconds}) when seconds == 0, do: "On time"

  defp adherence(%Vehicle{schedule_adherence_secs: seconds}) do
    minutes = abs(floor(seconds / 60))
    punctuality = if seconds < 0, do: "early", else: "late"
    "#{minutes} min #{punctuality}"
  end
end
