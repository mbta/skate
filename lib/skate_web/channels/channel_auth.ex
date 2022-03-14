defmodule SkateWeb.ChannelAuth do
  alias SkateWeb.AuthManager

  @doc """
  Checks wether a socket has a valid token.
  """
  @spec valid_token?(Phoenix.Socket.t()) :: boolean()
  def valid_token?(socket) do
    token = Guardian.Phoenix.Socket.current_token(socket)

    case AuthManager.decode_and_verify(token) do
      {:ok, _claims} ->
        true

      _ ->
        false
    end
  end
end
