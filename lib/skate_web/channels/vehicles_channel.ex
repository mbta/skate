defmodule SkateWeb.VehiclesChannel do
  use SkateWeb, :channel

  alias Realtime.Server
  alias SkateWeb.AuthManager
  alias Util.Duration

  @impl Phoenix.Channel
  def join("vehicles:shuttle:all", _message, socket) do
    shuttles = Duration.log_duration(Server, :subscribe_to_all_shuttles, [])
    {:ok, %{data: shuttles}, socket}
  end

  def join("vehicles:route:" <> route_id, _message, socket) do
    vehicles_for_route = Duration.log_duration(Server, :subscribe_to_route, [route_id])
    {:ok, vehicles_for_route, socket}
  end

  def join("vehicles:search:" <> search_params, _message, socket) do
    subscribe_args =
      case search_params do
        "all:" <> text ->
          [text, :all]

        "run:" <> text ->
          [text, :run]

        "vehicle:" <> text ->
          [text, :vehicle]

        "operator:" <> text ->
          [text, :operator]
      end

    vehicles = Duration.log_duration(Server, :subscribe_to_search, subscribe_args)

    {:ok, %{data: vehicles}, socket}
  end

  def join(topic, _message, _socket) do
    {:error, %{message: "no such topic \"#{topic}\""}}
  end

  @impl Phoenix.Channel
  def handle_info({:new_realtime_data, lookup_args}, socket) do
    token = Guardian.Phoenix.Socket.current_token(socket)

    case AuthManager.decode_and_verify(token) do
      {:ok, _claims} ->
        # Refresh a token before it expires
        case AuthManager.refresh(token) do
          {:ok, _old_claims, {_new_token, _new_claims}} ->
            push_vehicles(socket, lookup_args)

          {:error, :token_expired} ->
            handle_expired_token(socket, lookup_args)
        end

      {:error, :token_expired} ->
        handle_expired_token(socket, lookup_args)

      _ ->
        {:stop, :normal, send_auth_expired_message(socket)}
    end
  end

  @spec push_vehicles(Phoenix.Socket.t(), Server.lookup_key()) ::
          {:noreply, Phoenix.Socket.t()}
  defp push_vehicles(socket, {_ets, :all_shuttles} = lookup) do
    push(socket, "shuttles", %{data: Server.lookup(lookup)})
    {:noreply, socket}
  end

  defp push_vehicles(socket, {_ets, {:search, _}} = lookup) do
    push(socket, "search", %{data: Server.lookup(lookup)})
    {:noreply, socket}
  end

  defp push_vehicles(socket, lookup) do
    push(socket, "vehicles", Server.lookup(lookup))
    {:noreply, socket}
  end

  @spec handle_expired_token(Phoenix.Socket.t(), Server.lookup_key()) ::
          {:noreply, Phoenix.Socket.t()} | {:stop, :normal, Phoenix.Socket.t()}
  defp handle_expired_token(socket, lookup_args) do
    refresh_token_store = Application.get_env(:skate, :refresh_token_store)

    refresh_token =
      socket
      |> Guardian.Phoenix.Socket.current_resource()
      |> refresh_token_store.get_refresh_token()

    # Exchange a token of type "refresh" for a new token of type "access"
    case AuthManager.exchange(refresh_token, "refresh", "access") do
      {:ok, _old_stuff, {_new_token, _new_claims}} ->
        push_vehicles(socket, lookup_args)

      _ ->
        {:stop, :normal, send_auth_expired_message(socket)}
    end
  end

  @spec send_auth_expired_message(Phoenix.Socket.t()) :: Phoenix.Socket.t()
  defp send_auth_expired_message(socket) do
    :ok = push(socket, "auth_expired", %{})
    socket
  end
end
