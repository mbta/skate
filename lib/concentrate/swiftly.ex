defmodule Concentrate.Swiftly do
  @moduledoc """
  Parser for Swiftly Real-time Vehicles API response.

  Documentation:
  https://realtime-docs.goswift.ly/api-reference/real-time/getrealtimeagencykeyvehicles
  """
  @behaviour Concentrate.Parser

  alias Gtfs.Block
  alias Gtfs.Direction
  alias Gtfs.Route
  alias Gtfs.Run
  alias Gtfs.Stop
  alias Gtfs.Trip

  @type t :: %__MODULE__{
          id: String.t(),
          trip_id: Trip.id() | nil,
          stop_id: Stop.id() | nil,
          latitude: float(),
          longitude: float(),
          last_updated: Util.Time.timestamp(),
          speed: float(),
          bearing: integer(),
          block_id: Block.id() | nil,
          run_id: Run.id() | nil,
          operator_id: String.t(),
          operator_name: String.t(),
          stop_name: String.t() | nil,
          direction_id: Direction.id() | nil,
          headsign: String.t() | nil,
          headway_secs: integer() | nil,
          is_nonrevenue: boolean(),
          layover_departure_time: Util.Time.timestamp() | nil,
          previous_vehicle_id: String.t() | nil,
          previous_vehicle_schedule_adherence_secs: integer() | nil,
          previous_vehicle_schedule_adherence_string: String.t() | nil,
          route_id: Route.id() | nil,
          schedule_adherence_secs: integer() | nil,
          schedule_adherence_string: String.t() | nil,
          scheduled_headway_secs: integer() | nil
        }

  defstruct [
    :id,
    :trip_id,
    :stop_id,
    :latitude,
    :longitude,
    :last_updated,
    :speed,
    :bearing,
    :block_id,
    :run_id,
    :operator_id,
    :operator_name,
    :stop_name,
    :direction_id,
    :headsign,
    :headway_secs,
    :is_nonrevenue,
    :layover_departure_time,
    :previous_vehicle_id,
    :previous_vehicle_schedule_adherence_secs,
    :previous_vehicle_schedule_adherence_string,
    :route_id,
    :schedule_adherence_secs,
    :schedule_adherence_string,
    :scheduled_headway_secs
  ]

  @impl Concentrate.Parser
  def parse(binary) when is_binary(binary) do
    binary
    |> Jason.decode!(strings: :copy)
    |> decode_response()
  end

  @spec decode_response(map()) :: [t()]
  defp decode_response(%{"data" => %{"vehicles" => vehicles}}), do: decode_vehicles(vehicles)

  @spec decode_vehicles([map()]) :: [t()]
  defp decode_vehicles(vehicles), do: Enum.map(vehicles, &decode_vehicle/1)

  @spec decode_vehicle(map()) :: t()
  def decode_vehicle(vehicle_data) do
    loc = Map.get(vehicle_data, "loc", %{})
    {operator_name, operator_id} = vehicle_data |> Map.get("driver") |> operator_details()

    %__MODULE__{
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
      scheduled_headway_secs: Map.get(vehicle_data, "scheduledHeadwaySecs")
    }
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
