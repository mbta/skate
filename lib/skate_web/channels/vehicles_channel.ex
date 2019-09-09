defmodule SkateWeb.VehiclesChannel do
  use SkateWeb, :channel

  alias Realtime.Server
  alias SkateWeb.AuthManager

  @impl Phoenix.Channel
  def join("vehicles:shuttle:all", _message, socket) do
    shuttles = Server.subscribe_to_all_shuttles()
    {:ok, shuttles, socket}
  end

  def join("vehicles:route:" <> route_id, _message, socket) do
    vehicles_for_route = Server.subscribe_to_route(route_id)
    {:ok, vehicles_for_route, socket}
  end

  def join(topic, _message, _socket) do
    {:error, %{message: "no such topic \"#{topic}\""}}
  end

  @impl Phoenix.Channel
  def handle_info({:new_realtime_data, data_category, lookup_args}, socket) do
    token = Guardian.Phoenix.Socket.current_token(socket)

    case AuthManager.decode_and_verify(token) do
      {:ok, _claims} ->
        # Refresh a token before it expires
        {:ok, _old_claims, {_new_token, _new_claims}} = AuthManager.refresh(token)

        push_vehicles(socket, data_category, lookup_args)

      {:error, :token_expired} ->
        refresh_token_store = Application.get_env(:skate, :refresh_token_store)

        refresh_token =
          socket
          |> Guardian.Phoenix.Socket.current_resource()
          |> refresh_token_store.get_refresh_token()

        # Exchange a token of type "refresh" for a new token of type "access"
        case AuthManager.exchange(refresh_token, "refresh", "access") do
          {:ok, _old_stuff, {_new_token, _new_claims}} ->
            push_vehicles(socket, data_category, lookup_args)

          _ ->
            {:stop, :normal, send_auth_expired_message(socket)}
        end

      _ ->
        {:stop, :normal, send_auth_expired_message(socket)}
    end
  end

  @spec push_vehicles(Phoenix.Socket.t(), Server.data_category(), Server.lookup_key()) ::
          {:noreply, Phoenix.Socket.t()}
  defp push_vehicles(socket, :vehicles, lookup) do
    push(socket, "vehicles", Server.lookup(lookup))
    {:noreply, socket}
  end

  defp push_vehicles(socket, :shuttles, lookup) do
    push(socket, "shuttles", %{data: Server.lookup(lookup)})
    {:noreply, socket}
  end

  @spec send_auth_expired_message(Phoenix.Socket.t()) :: Phoenix.Socket.t()
  defp send_auth_expired_message(socket) do
    :ok = push(socket, "auth_expired", %{})
    socket
  end
end
