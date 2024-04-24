defmodule SkateWeb.Plugs.CaptureAuthReturnPath do
  import Plug.Conn

  use SkateWeb, :verified_routes

  def init(default), do: default

  def call(conn, _default) do
    put_session(conn, :post_auth_return_to, request_url(conn))
  end

  @spec get_post_auth_return_to_path(Plug.Conn.t()) :: String.t()
  def get_post_auth_return_to_path(conn) do
    conn
    |> read_return_to_from_session()
    |> case do
      nil -> ~p"/"
      return_to -> URI.parse(return_to).path
    end
  end

  defp read_return_to_from_session(conn) do
    conn
    |> fetch_session()
    |> get_session(:post_auth_return_to)
  end
end
