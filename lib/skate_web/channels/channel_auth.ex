defmodule SkateWeb.ChannelAuth do
  alias SkateWeb.AuthManager

  @doc """
  Checks wether a socket has a valid token.
  """
  @spec valid_token?(Phoenix.Socket.t()) :: boolean()
  def valid_token?(socket) do
    token_fn = Application.get_env(:skate, :valid_token_fn, &_valid_token?/1)
    token_fn.(socket)
  end

  @spec _valid_token?(Phoenix.Socket.t()) :: boolean()
  defp _valid_token?(socket) do
    token = Guardian.Phoenix.Socket.current_token(socket)

    case AuthManager.decode_and_verify(token) do
      {:ok, _claims} ->
        true

      _ ->
        false
    end
  end
end
