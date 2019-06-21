defmodule SkateWeb.VehiclesChannel do
  use SkateWeb, :channel

  alias Realtime.Server
  alias SkateWeb.AuthManager

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
    if socket_authenticated?(socket) do
      push(socket, "vehicles", %{vehicles: vehicles})
      {:noreply, socket}
    else
      {:stop, :normal, send_auth_expired_message(socket)}
    end
  end

  @spec socket_authenticated?(Phoenix.Socket.t()) :: boolean()
  defp socket_authenticated?(socket) do
    token = Guardian.Phoenix.Socket.current_token(socket)

    with {:ok, _claims} <- AuthManager.decode_and_verify(token) do
      true
    else
      _ -> false
    end
  end

  @spec send_auth_expired_message(Phoenix.Socket.t()) :: Phoenix.Socket.t()
  defp send_auth_expired_message(socket) do
    :ok = push(socket, "auth_expired", %{})
    socket
  end
end
