defmodule Concentrate.Consumer.VehiclePositions do
  @moduledoc """
  Consumes output from Merge and reports vehicle positions to the realtime server.
  """

  use GenStage

  alias Concentrate.{Merge, VehiclePosition}
  alias Realtime.{Vehicles, Server, Vehicle}

  @send_interval 1_000

  def start_link(opts) do
    GenStage.start_link(__MODULE__, opts)
  end

  @impl GenStage
  def init(opts) do
    _ = :timer.send_interval(@send_interval, :send)
    {:consumer, [], opts}
  end

  @impl GenStage
  def handle_events(events, _from, _state) do
    groups = List.last(events)

    {:noreply, [], groups}
  end

  @impl GenStage
  def handle_info(:send, groups) do
    all_vehicles =
      groups
      |> vehicle_positions_from_groups()
      |> Enum.map(&Vehicle.from_vehicle_position/1)

    timepoint_names_by_id = Schedule.timepoint_names_by_id()

    by_route = Vehicles.group_by_route(all_vehicles, timepoint_names_by_id)
    shuttles = Enum.filter(all_vehicles, & &1.is_shuttle)

    _ = Server.update({by_route, shuttles})

    {:noreply, [], groups}
  end

  @spec vehicle_positions_from_groups([Merge.trip_group()]) :: [VehiclePosition.t()]
  defp vehicle_positions_from_groups(groups) do
    Enum.flat_map(groups, fn {_trip_update, vehicle_positions, _stop_time_updates} ->
      vehicle_positions
    end)
  end
end
