defmodule SkateWeb.VehicleChannel do
  use SkateWeb, :channel

  alias Realtime.Server

  @impl true
  def handle_info({:new_realtime_data, lookup_params}, socket) do
    vehicle_or_ghost = Realtime.Server.lookup(lookup_params)
    :ok = push(socket, "vehicle", %{data: List.first(vehicle_or_ghost)})

    {:noreply, socket}
  end

  use SkateWeb.AuthenticatedChannel
  @impl SkateWeb.AuthenticatedChannel
  def join_authenticated("vehicle:run_ids:" <> run_ids, _message, socket) do
    run_ids = String.split(run_ids, ",")
    vehicle_or_ghost = Realtime.Server.peek_at_vehicles_by_run_ids(run_ids) |> List.first()

    if vehicle_or_ghost do
      _ = Server.subscribe_to_vehicle(vehicle_or_ghost.id)
    end

    {:ok, %{data: vehicle_or_ghost}, socket}
  end

  def join_authenticated("vehicle:id:" <> vehicle_or_ghost_id, _message, socket) do
    vehicle_or_ghost = Realtime.Server.peek_at_vehicle_by_id(vehicle_or_ghost_id) |> List.first()

    if vehicle_or_ghost do
      _ = Server.subscribe_to_vehicle(vehicle_or_ghost.id)
    end

    {:ok, %{data: vehicle_or_ghost}, socket}
  end
end
