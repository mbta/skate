defmodule Concentrate.Consumer.VehiclePositions do
  @moduledoc """
  Consumes output from Merge and reports vehicle positions to the realtime server.
  """

  use GenStage

  alias Concentrate.{Merge, TripUpdate, VehiclePosition}
  alias Realtime.{Server, Vehicle}

  # alias Concentrate.{Reporter, TripUpdate, VehiclePosition}
  # alias Realtime.{Server, Vehicle}

  def start_link(opts) do
    GenStage.start_link(__MODULE__, opts)
  end

  @impl GenStage
  def init(opts) do
    {:consumer, :the_state_does_not_matter, opts}
  end

  @impl GenStage
  def handle_events(events, _from, state) do
    groups = List.last(events)

    vehicles_by_route_id = vehicles_by_route_id(groups)
    Server.update_vehicles(vehicles_by_route_id)

    {:noreply, [], state}
  end

  @spec vehicles_by_route_id([Merge.trip_group()]) :: Server.vehicles_by_route_id()
  defp vehicles_by_route_id(groups) do
    groups
    |> Enum.flat_map(&vehicle_positions_with_trip_update/1)
    |> Enum.map(fn {vehicle_position, trip_update} ->
      Vehicle.from_vehicle_position_and_trip_update(vehicle_position, trip_update)
    end)
    |> Enum.reject(&is_nil(&1))
    |> Enum.group_by(& &1.route_id)
  end

  @type vehile_position_trip_update_pair :: {VehiclePosition.t(), TripUpdate.t()}
  @spec vehicle_positions_with_trip_update(Merge.trip_group()) ::
          [vehile_position_trip_update_pair()]
  defp vehicle_positions_with_trip_update({trip_update, vehicle_positions, _stop_time_updates}) do
    Enum.map(vehicle_positions, &{&1, trip_update})
  end
end
