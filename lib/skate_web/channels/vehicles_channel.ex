defmodule SkateWeb.VehiclesChannel do
  use SkateWeb, :channel

  alias Phoenix.Socket
  alias Realtime.{Server, Vehicle}

  @spec join(topic :: String.t(), payload :: map, socket :: Socket.t()) ::
          {:ok, reply :: %{vehicles: Server.vehicles()}, Socket.t()}
  def join("vehicles:" <> route_id, _message, socket) do
    vehicles = Realtime.Server.subscribe(route_id)
    {:ok, %{vehicles: vehicles}, socket}
  end

  def join(topic, _message, _socket) do
    {:error, %{message: "no such topic \"#{topic}\""}}
  end

  @spec handle_info(msg :: {:new_realtime_data, [Vehicle.t()]}, socket :: Socket.t()) ::
          {:noreply, Socket.t()}
  def handle_info({:new_realtime_data, vehicles}, socket) do
    push(socket, "vehicles", %{vehicles: vehicles})
    {:noreply, socket}
  end
end
