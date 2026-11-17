defmodule Skate.Radio.VehicleData do
  @moduledoc """
  Maps RTT messages to realtime vehicle data and converts it to JSON-ready radio display data.
  """

  alias Realtime.{Server, Vehicle}
  alias Schedule.Garage
  alias Skate.Radio.RttData

  require Logger

  @type data :: %{
          required(String.t()) => String.t() | nil
        }

  @doc """
  Returns the latest realtime vehicle for an exact feed ID.

  Returns an explicit error for invalid IDs or vehicles absent from the live
  store (including ghost vehicles), so callers can fail an SQS message for retry.
  """
  @spec fetch(String.t()) ::
          {:ok, Vehicle.t()} | {:error, :vehicle_not_found | :invalid_vehicle_id}
  def fetch(vehicle_id) when is_binary(vehicle_id) and vehicle_id != "" do
    case Server.peek_at_vehicle_by_id(vehicle_id) do
      [%Vehicle{} = vehicle] ->
        {:ok, vehicle}

      _ ->
        Logger.warning("Radio vehicle lookup failed: vehicle not found #{inspect(vehicle_id)}")
        {:error, :vehicle_not_found}
    end
  end

  def fetch(vehicle_id) do
    Logger.warning("Radio vehicle lookup failed: invalid vehicle ID #{inspect(vehicle_id)}")
    {:error, :invalid_vehicle_id}
  end

  @doc """
  Maps a decoded RTT message to a JSON-ready call with latest vehicle data.

  Looks up `"y" <> Initiator.UnitID` and converts `RadioMessageID` to a string.
  Validates the final output against `Skate.Radio.RttData`
  """
  @spec map_rtt_data(map()) ::
          {:ok, RttData.t()}
          | {:error,
             :invalid_rtt_data
             | :vehicle_not_found
             | :invalid_vehicle_id
             | {:invalid_rtt_data, RttData.errors()}}
  def map_rtt_data(
        %{
          "RadioMessageID" => id,
          "Initiator" => %{"UnitID" => unit_id},
          "InitialTimeStamp" => received_at
        } = rtt_data
      )
      when ((is_integer(id) and id >= 0) or (is_binary(id) and id != "")) and
             is_integer(unit_id) and unit_id > 0 and is_binary(received_at) and
             received_at != "" do
    with {:ok, vehicle} <- fetch("y" <> Integer.to_string(unit_id)) do
      data =
        Map.merge(map_vehicle(vehicle), %{
          "id" => to_string(id),
          "callType" => RttData.default_call_type(),
          "talkGroup" => get_in(rtt_data, ["CurrentGroup", "Alias"]),
          "receivedAt" => received_at,
          "respondedBy" => nil,
          "answeredAt" => nil,
          "markedDoneAt" => nil,
          "status" => RttData.default_status()
        })

      case RttData.validate(data) do
        {:ok, data} ->
          {:ok, data}

        {:error, errors} ->
          Logger.warning("Radio RTT mapping failed: invalid output #{inspect(errors)}")
          {:error, {:invalid_rtt_data, errors}}
      end
    end
  end

  def map_rtt_data(_rtt_data) do
    Logger.warning("Radio RTT mapping failed: invalid RTT data")
    {:error, :invalid_rtt_data}
  end

  @doc """
  Maps vehicle-related fields to a JSON-ready format.
  """
  @spec map_vehicle(Vehicle.t()) :: data()
  def map_vehicle(%Vehicle{} = vehicle) do
    route = vehicle.route_id && Schedule.route_by_id(vehicle.route_id)

    %{
      "routeId" => vehicle.route_id,
      "routeName" => route && route.name,
      "vehicleId" => vehicle.id,
      "garage" => Garage.garage_for_block(vehicle.block_id),
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
