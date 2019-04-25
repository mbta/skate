defmodule SkateWeb.VehiclesChannel do
  use SkateWeb, :channel

  alias Realtime.Server

  @impl Phoenix.Channel
  def join("vehicles:" <> route_id, _message, socket) do
    vehicles = Server.subscribe(route_id)
    {:ok, %{vehicles: vehicles}, socket}
  end

  def join(topic, _message, _socket) do
    {:error, %{message: "no such topic \"#{topic}\""}}
  end

  @impl Phoenix.Channel
  def handle_info({:new_realtime_data, vehicles}, socket) do
    push(socket, "vehicles", %{vehicles: vehicles})
    {:noreply, socket}
  end
end
