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

    last_updated = Map.get(loc, "time")

    VehiclePosition.new(
      id: Map.get(vehicle_data, "id"),
      trip_id: Map.get(vehicle_data, "tripId"),
      stop_id: Map.get(vehicle_data, "nextStopId"),
      latitude: Map.get(loc, "lat"),
      longitude: Map.get(loc, "lon"),
      last_updated: last_updated,
      last_updated_by_source: %{"swiftly" => last_updated},
      speed: Map.get(loc, "speed"),
      bearing: Map.get(loc, "heading"),
      block_id: Map.get(vehicle_data, "blockId"),
      run_id: Map.get(vehicle_data, "runId"),
      stop_name: Map.get(vehicle_data, "nextStopName"),
      direction_id: vehicle_data |> Map.get("directionId") |> direction_id_from_string(),
      headsign: Map.get(vehicle_data, "headsign"),
      layover_departure_time: Map.get(vehicle_data, "layoverDepTime"),
      previous_vehicle_id: Map.get(vehicle_data, "previousVehicleId"),
      previous_vehicle_schedule_adherence_secs:
        Map.get(vehicle_data, "previousVehicleSchAdhSecs"),
      previous_vehicle_schedule_adherence_string:
        Map.get(vehicle_data, "previousVehicleSchAdhStr"),
      route_id: Map.get(vehicle_data, "routeId"),
      schedule_adherence_secs: Map.get(vehicle_data, "schAdhSecs"),
      schedule_adherence_string: Map.get(vehicle_data, "schAdhStr"),
      sources: MapSet.new(["swiftly"]),
      data_discrepancies: []
    )
  end

  defp direction_id_from_string(nil), do: nil
  defp direction_id_from_string(direction_string), do: Direction.id_from_string(direction_string)
end
