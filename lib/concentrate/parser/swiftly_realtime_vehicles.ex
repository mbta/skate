defmodule Concentrate.Parser.SwiftlyRealtimeVehicles do
  @moduledoc """
  Parser for Swiftly Real-time Vehicles API response.

  Documentation:
  https://realtime-docs.goswift.ly/api-reference/real-time/getrealtimeagencykeyvehicles
  """
  @behaviour Concentrate.Parser

  alias Concentrate.VehiclePosition
  alias Schedule.Gtfs.Direction

  @impl Concentrate.Parser
  def parse(binary) when is_binary(binary) do
    binary
    |> Jason.decode!(strings: :copy)
    |> decode_response()
  end

  @spec decode_response(map()) :: [VehiclePosition.t()]
  defp decode_response(%{"data" => %{"vehicles" => vehicles}}), do: decode_vehicles(vehicles)

  @spec decode_vehicles([map()]) :: [VehiclePosition.t()]
  defp decode_vehicles(vehicles), do: Enum.map(vehicles, &decode_vehicle/1)

  @spec decode_vehicle(map()) :: VehiclePosition.t()
  def decode_vehicle(vehicle_data) do
    loc = Map.get(vehicle_data, "loc", %{})
    {operator_name, operator_id} = vehicle_data |> Map.get("driver") |> operator_details()

    VehiclePosition.new(
      id: Map.get(vehicle_data, "id"),
      trip_id: Map.get(vehicle_data, "tripId"),
      stop_id: Map.get(vehicle_data, "nextStopId"),
      latitude: Map.get(loc, "lat"),
      longitude: Map.get(loc, "lon"),
      last_updated: Map.get(loc, "time"),
      speed: Map.get(loc, "speed"),
      bearing: Map.get(loc, "heading"),
      block_id: Map.get(vehicle_data, "blockId"),
      run_id: Map.get(vehicle_data, "runId"),
      operator_id: operator_id,
      operator_name: operator_name,
      stop_name: Map.get(vehicle_data, "nextStopName"),
      direction_id: vehicle_data |> Map.get("directionId") |> direction_id_from_string(),
      headsign: Map.get(vehicle_data, "headsign"),
      headway_secs: Map.get(vehicle_data, "headwaySecs"),
      is_nonrevenue: Map.get(vehicle_data, "layover", false),
      layover_departure_time: Map.get(vehicle_data, "layoverDepTime"),
      previous_vehicle_id: Map.get(vehicle_data, "previousVehicleId"),
      previous_vehicle_schedule_adherence_secs:
        Map.get(vehicle_data, "previousVehicleSchAdhSecs"),
      previous_vehicle_schedule_adherence_string:
        Map.get(vehicle_data, "previousVehicleSchAdhStr"),
      route_id: Map.get(vehicle_data, "routeId"),
      schedule_adherence_secs: Map.get(vehicle_data, "schAdhSecs"),
      schedule_adherence_string: Map.get(vehicle_data, "schAdhStr"),
      scheduled_headway_secs: Map.get(vehicle_data, "scheduledHeadwaySecs"),
      sources: MapSet.new(["swiftly"]),
      data_discrepancies: []
    )
  end

  @spec operator_details(String.t() | nil) :: {String.t() | nil, String.t() | nil}
  defp operator_details(nil), do: {nil, nil}

  defp operator_details(operator_string) do
    case String.split(operator_string, " - ") do
      [operator_name, operator_id] -> {operator_name, operator_id}
      _ -> {nil, nil}
    end
  end

  defp direction_id_from_string(nil), do: nil
  defp direction_id_from_string(direction_string), do: Direction.id_from_string(direction_string)
end
