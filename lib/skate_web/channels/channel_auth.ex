defmodule SkateWeb.ChannelAuth do
  @moduledoc false

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
    socket
    |> Guardian.Phoenix.Socket.current_token()
    |> AuthManager.decode_and_verify()
    |> then(&match?({:ok, _claims}, &1))
  end
end
