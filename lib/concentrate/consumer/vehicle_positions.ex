defmodule Concentrate.Consumer.VehiclePositions do
  @moduledoc """
  Consumes output from Merge and reports vehicle positions to the realtime server.
  """

  use GenStage

  alias Concentrate.{Merge, VehiclePosition}
  alias Realtime.{Vehicles, Server, Vehicle}

  def start_link(opts) do
    GenStage.start_link(__MODULE__, opts)
  end

  @impl GenStage
  def init(opts) do
    {:consumer, :the_state_does_not_matter, opts}
  end

  # If we get a reply after we've already timed out, ignore it
  @impl GenStage
  def handle_info({reference, _}, state) when is_reference(reference),
    do: {:noreply, [], state}

  @impl GenStage
  def handle_events(events, _from, state) do
    groups = List.last(events)

    all_vehicles =
      groups
      |> vehicle_positions_from_groups()
      |> Enum.map(&Vehicle.from_vehicle_position/1)

    by_route = Vehicles.group_by_route(all_vehicles)
    shuttles = Enum.filter(all_vehicles, & &1.is_shuttle)

    _ = Server.update({by_route, shuttles})

    {:noreply, [], state}
  end

  @spec vehicle_positions_from_groups([Merge.trip_group()]) :: [VehiclePosition.t()]
  defp vehicle_positions_from_groups(groups) do
    Enum.flat_map(groups, fn {_trip_update, vehicle_positions, _stop_time_updates} ->
      vehicle_positions
    end)
  end
end
