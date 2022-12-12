defmodule SkateWeb.ChannelAuth do
  alias SkateWeb.AuthManager

  @doc """
  Checks wether a socket has a valid token.
  """
  @spec valid_token?(Phoenix.Socket.t()) :: boolean()
  def valid_token?(socket) do
    token_fn = Application.get_env(:skate, :valid_token_fn, &valid_socket_token?/1)
    token_fn.(socket)
  end

  @spec valid_socket_token?(Phoenix.Socket.t()) :: boolean()
  defp valid_socket_token?(socket) do
    token = Guardian.Phoenix.Socket.current_token(socket)

    match?({:ok, _claims}, AuthManager.decode_and_verify(token))
  end
end
