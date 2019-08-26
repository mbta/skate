defmodule SkateWeb.RouteVehiclesChannel do
  use SkateWeb, :channel

  alias Realtime.{Servers.RouteVehicles, Vehicles}

  alias SkateWeb.Channels.Helpers

  @impl Phoenix.Channel
  def join("vehicles:" <> route_id, _message, socket) do
    vehicles_for_route = RouteVehicles.subscribe(route_id)
    {:ok, vehicles_for_route, socket}
  end

  def join(topic, _message, _socket) do
    {:error, %{message: "no such topic \"#{topic}\""}}
  end

  @impl Phoenix.Channel
  def handle_info({:new_realtime_data, vehicles_for_route}, socket) do
    Helpers.push_or_refresh(socket, fn -> push_vehicles(socket, vehicles_for_route) end)
  end

  @spec push_vehicles(Phoenix.Socket.t(), Vehicles.for_route()) ::
          {:noreply, Phoenix.Socket.t()}
  defp push_vehicles(socket, vehicles) do
    push(socket, "vehicles", vehicles)
    {:noreply, socket}
  end
end
