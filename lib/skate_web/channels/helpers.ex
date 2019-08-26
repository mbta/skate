defmodule SkateWeb.Channels.Helpers do
  alias Phoenix.{
    Channel,
    Socket
  }

  alias SkateWeb.AuthManager

  @spec push_or_refresh(Socket.t(), (() -> {:noreply, Socket.t()})) ::
          {:noreply, Socket.t()} | {:stop, :normal, Socket.t()}
  def push_or_refresh(socket, callback) do
    token = Guardian.Phoenix.Socket.current_token(socket)

    case AuthManager.decode_and_verify(token) do
      {:ok, _claims} ->
        # Refresh a token before it expires
        {:ok, _old_claims, {_new_token, _new_claims}} = AuthManager.refresh(token)

        callback.()

      {:error, :token_expired} ->
        refresh_token_store = Application.get_env(:skate, :refresh_token_store)

        refresh_token =
          socket
          |> Guardian.Phoenix.Socket.current_resource()
          |> refresh_token_store.get_refresh_token()

        # Exchange a token of type "refresh" for a new token of type "access"
        case AuthManager.exchange(refresh_token, "refresh", "access") do
          {:ok, _old_stuff, {_new_token, _new_claims}} ->
            callback.()

          _ ->
            {:stop, :normal, send_auth_expired_message(socket)}
        end

      _ ->
        {:stop, :normal, send_auth_expired_message(socket)}
    end
  end

  @spec send_auth_expired_message(Socket.t()) :: Socket.t()
  defp send_auth_expired_message(socket) do
    :ok = Channel.push(socket, "auth_expired", %{})
    socket
  end
end
