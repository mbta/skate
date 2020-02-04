defmodule SkateWeb.ChannelAuth do
  alias SkateWeb.AuthManager

  @doc """
  Checks wether a socket has a valid token.
  Attempts to refresh the token.
  Only returns false if all refreshing fails,
  and the user needs to log in again.
  """
  @spec valid_token?(Phoenix.Socket.t()) :: boolean()
  def valid_token?(socket) do
    token = Guardian.Phoenix.Socket.current_token(socket)

    case AuthManager.decode_and_verify(token) do
      {:ok, _claims} ->
        # Refresh a token before it expires
        case AuthManager.refresh(token) do
          {:ok, _old_claims, {_new_token, _new_claims}} ->
            true

          {:error, :token_expired} ->
            valid_token_after_refresh?(socket)
        end

      {:error, :token_expired} ->
        valid_token_after_refresh?(socket)

      _ ->
        false
    end
  end

  @spec valid_token_after_refresh?(Phoenix.Socket.t()) :: boolean()
  defp valid_token_after_refresh?(socket) do
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
