defmodule SkateWeb.VehiclesChannel do
  use SkateWeb, :channel
  require Logger

  alias Realtime.Server
  alias SkateWeb.AuthManager
  alias Util.Duration

  @impl Phoenix.Channel
  def join("vehicles:shuttle:all", _message, socket) do
    shuttles = Duration.log_duration(Server, :subscribe_to_all_shuttles, [])
    {:ok, %{data: shuttles}, socket}
  end

  def join("vehicles:route:" <> route_id, _message, socket) do
    vehicles_and_ghosts = Duration.log_duration(Server, :subscribe_to_route, [route_id])
    {:ok, %{data: vehicles_and_ghosts}, socket}
  end

  def join(
        "vehicles:search:" <> search_params,
        _message,
        %{assigns: %{guardian_default_resource: username}} = socket
      ) do
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

    Logger.info(fn ->
      "User=#{username} searched for property=#{Enum.at(subscribe_args, 1)}, text=#{
        Enum.at(subscribe_args, 0)
      }"
    end)

    vehicles = Duration.log_duration(Server, :subscribe_to_search, subscribe_args)

    {:ok, %{data: vehicles}, socket}
  end

  def join(topic, _message, _socket) do
    {:error, %{message: "no such topic \"#{topic}\""}}
  end

  @impl Phoenix.Channel
  def handle_info({:new_realtime_data, lookup_args}, socket) do
    if valid_token?(socket) do
      event_name = event_name(lookup_args)
      data = Server.lookup(lookup_args)
      :ok = push(socket, event_name, %{data: data})
      {:noreply, socket}
    else
      :ok = push(socket, "auth_expired", %{})
      {:stop, :normal, socket}
    end
  end

  @spec event_name(Server.lookup_key()) :: String.t()
  defp event_name({_ets, :all_shuttles}), do: "shuttles"
  defp event_name({_ets, {:search, _}}), do: "search"
  defp event_name({_ets, _}), do: "vehicles"

  @spec valid_token?(Phoenix.Socket.t()) :: boolean()
  defp valid_token?(socket) do
    token = Guardian.Phoenix.Socket.current_token(socket)
    case AuthManager.decode_and_verify(token) do
      {:ok, _claims} ->
        # Refresh a token before it expires
        case AuthManager.refresh(token) do
          {:ok, _old_claims, {_new_token, _new_claims}} ->
            true

          {:error, :token_expired} ->
            handle_expired_token(socket)
        end

      {:error, :token_expired} ->
        handle_expired_token(socket)

      _ ->
        false
    end
  end

  @spec handle_expired_token(Phoenix.Socket.t()) :: boolean()
  defp handle_expired_token(socket) do
    refresh_token_store = Application.get_env(:skate, :refresh_token_store)

    refresh_token =
      socket
      |> Guardian.Phoenix.Socket.current_resource()
      |> refresh_token_store.get_refresh_token()

    # Exchange a token of type "refresh" for a new token of type "access"
    case AuthManager.exchange(refresh_token, "refresh", "access") do
      {:ok, _old_stuff, {_new_token, _new_claims}} ->
        true

      _ ->
        false
    end
  end
end
