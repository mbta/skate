defmodule SkateWeb.VehicleChannel do
  use SkateWeb, :channel

  alias Realtime.Server

  @impl true
  def handle_info({:new_realtime_data, lookup_params}, socket) do
    vehicle_or_ghost = Realtime.Server.lookup(lookup_params)
    :ok = push(socket, "vehicle", make_payload(vehicle_or_ghost))

    {:noreply, socket}
  end

  @impl Phoenix.Channel
  def join("vehicle:trip_ids:" <> trip_ids, _message, socket) do
    trip_ids = String.split(trip_ids, ",")
    vehicle_or_ghost = Realtime.Server.peek_at_vehicles(trip_ids) |> List.first()
    payload = make_payload(vehicle_or_ghost)

    if vehicle_or_ghost do
      _ = Server.subscribe_to_vehicle(vehicle_or_ghost.id)
    end

    {:ok, payload, socket}
  end

  defp make_payload([]) do
    %{data: %{}}
  end

  defp make_payload([vehicle_or_ghost]) do
    make_payload(vehicle_or_ghost)
  end

  defp make_payload(vehicle_or_ghost) do
    route = Schedule.route_by_id(vehicle_or_ghost.route_id)
    data = %{vehicleOrGhostData: vehicle_or_ghost, routeData: route}
    %{data: data}
  end
end
