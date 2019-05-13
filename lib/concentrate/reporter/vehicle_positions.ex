defmodule Concentrate.Reporter.VehiclePositions do
  @behaviour Concentrate.Reporter

  alias Concentrate.Encoder.GTFSRealtimeHelpers
  alias Concentrate.{Reporter, TripUpdate, VehiclePosition}
  alias Realtime.{Server, Vehicle}

  @impl Reporter
  def init, do: []

  @impl Reporter
  def log(groups, state) do
    vehicles_by_route_id = vehicles_by_route_id(groups)

    Server.update_vehicles(vehicles_by_route_id)

    {[num_vehicles: num_vehicles(vehicles_by_route_id)], state}
  end

  @spec vehicles_by_route_id([GTFSRealtimeHelpers.trip_group()]) :: Server.vehicles()
  defp vehicles_by_route_id(groups) do
    groups
    |> Enum.filter(&has_vehicle_positions?/1)
    |> Enum.flat_map(&vehicle_positions_with_trip_update/1)
    |> Enum.map(fn {vehicle_position, trip_update} ->
      Vehicle.from_vehicle_position_and_trip_update(vehicle_position, trip_update)
    end)
    |> Enum.group_by(& &1.route_id)
  end

  @spec has_vehicle_positions?(GTFSRealtimeHelpers.trip_group()) :: boolean
  defp has_vehicle_positions?({_, vehicle_positions, _}), do: length(vehicle_positions) > 0

  @type vehile_position_trip_update_pair :: {VehiclePosition.t(), TripUpdate.t()}
  @spec vehicle_positions_with_trip_update(GTFSRealtimeHelpers.trip_group()) ::
          [vehile_position_trip_update_pair()]
  defp vehicle_positions_with_trip_update({trip_update, vehicle_positions, _stop_time_updates}) do
    Enum.map(vehicle_positions, &{&1, trip_update})
  end

  @spec num_vehicles(Server.vehicles()) :: integer()
  defp num_vehicles(vehicles_by_route_id) do
    vehicles_by_route_id
    |> Map.values()
    |> Enum.flat_map(& &1)
    |> Kernel.length()
  end
end
