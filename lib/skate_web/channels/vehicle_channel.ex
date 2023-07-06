defmodule SkateWeb.VehicleChannel do
  use SkateWeb, :channel
  use SkateWeb.AuthenticatedChannel

  alias Realtime.Server

  @impl true
  def handle_info({:new_realtime_data, lookup_params}, socket) do
    vehicle_or_ghost = Realtime.Server.lookup(lookup_params)
    :ok = push(socket, "vehicle", %{data: List.first(vehicle_or_ghost)})

    {:noreply, socket}
  end

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
    %{id: user_id} = Guardian.Phoenix.Socket.current_resource(socket)

    user_in_test_group? =
      Skate.Settings.User.is_in_test_group(user_id, "search-logged-out-vehicles")

    vehicle_or_ghost =
      if user_in_test_group? do
        Realtime.Server.peek_at_vehicle_by_id_with_logged_out(vehicle_or_ghost_id) |> List.first()
      else
        Realtime.Server.peek_at_vehicle_by_id(vehicle_or_ghost_id) |> List.first()
      end

    if vehicle_or_ghost do
      if user_in_test_group? do
        _ = Server.subscribe_to_vehicle_with_logged_out(vehicle_or_ghost.id)
      else
        _ = Server.subscribe_to_vehicle(vehicle_or_ghost.id)
      end
    end

    {:ok, %{data: vehicle_or_ghost}, socket}
  end
end
