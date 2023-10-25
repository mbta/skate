defmodule SkateWeb.VehicleChannel do
  use SkateWeb, :channel
  use SkateWeb.AuthenticatedChannel

  alias Realtime.Server

  @impl SkateWeb.AuthenticatedChannel
  def handle_info_authenticated({:new_realtime_data, ets}, socket) do
    lookup_key = socket.assigns[:lookup_key]

    vehicle_or_ghost = Realtime.Server.lookup({ets, lookup_key})

    :ok = push(socket, "vehicle", %{data: List.first(vehicle_or_ghost)})

    {:noreply, socket}
  end

  @impl SkateWeb.AuthenticatedChannel
  def join_authenticated("vehicle:run_ids:" <> run_ids, _message, socket) do
    run_ids = String.split(run_ids, ",")

    vehicle_or_ghost = Realtime.Server.peek_at_vehicles_by_run_ids(run_ids) |> List.first()

    socket =
      if vehicle_or_ghost do
        {lookup_key, _vehicle_or_ghost} = Server.subscribe_to_vehicle(vehicle_or_ghost.id)

        Phoenix.Socket.assign(socket, Map.merge(socket.assigns, %{lookup_key: lookup_key}))
      else
        socket
      end

    {:ok, %{data: vehicle_or_ghost}, socket}
  end

  def join_authenticated("vehicle:id:" <> vehicle_or_ghost_id, _message, socket) do
    %{id: user_id} = Guardian.Phoenix.Socket.current_resource(socket)

    user_in_test_group? = Skate.Settings.User.is_in_test_group(user_id, "map-beta")

    vehicle_or_ghost =
      if user_in_test_group? do
        Realtime.Server.peek_at_vehicle_by_id_with_logged_out(vehicle_or_ghost_id) |> List.first()
      else
        Realtime.Server.peek_at_vehicle_by_id(vehicle_or_ghost_id) |> List.first()
      end

    {lookup_key, _vehicle_or_ghost} =
      if vehicle_or_ghost do
        if user_in_test_group? do
          Server.subscribe_to_vehicle_with_logged_out(vehicle_or_ghost.id)
        else
          Server.subscribe_to_vehicle(vehicle_or_ghost.id)
        end
      else
        {nil, nil}
      end

    socket =
      if is_nil(lookup_key) do
        socket
      else
        Phoenix.Socket.assign(socket, Map.merge(socket.assigns, %{lookup_key: lookup_key}))
      end

    {:ok, %{data: vehicle_or_ghost}, socket}
  end
end
