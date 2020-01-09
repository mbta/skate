defmodule Concentrate.Consumer.VehiclePositions do
  @moduledoc """
  Consumes output from Merge and reports vehicle positions to the realtime server.
  """

  use GenStage

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
    vehicle_positions = List.last(events)
    all_vehicles = Enum.map(vehicle_positions, &Vehicle.from_vehicle_position/1)
    by_route = Vehicles.group_by_route(all_vehicles)
    shuttles = Enum.filter(all_vehicles, &Vehicle.shuttle?/1)

    _ = Server.update({by_route, shuttles})

    {:noreply, [], state}
  end
end
