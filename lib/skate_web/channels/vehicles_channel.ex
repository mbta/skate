defmodule SkateWeb.VehiclesChannel do
  use SkateWeb, :channel

  def join("vehicles:" <> route_id, _message, socket) do
    vehicles = Realtime.Server.subscribe(route_id)
    {:ok, %{vehicles: vehicles}, socket}
  end

  def join(topic, _message, _socket) do
    {:error, %{message: "no such topic \"#{topic}\""}}
  end

  def handle_info({:new_realtime_data, vehicles}, socket) do
    push(socket, "vehicles", %{vehicles: vehicles})
    {:noreply, socket}
  end
end
