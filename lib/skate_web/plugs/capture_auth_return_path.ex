defmodule SkateWeb.Plugs.CaptureAuthReturnPath do
  @moduledoc """
  Set a cookie value `:post_auth_return_to` with the current request url,
  and allow a mechanism to get that url easily.
  """

  import Plug.Conn

  use SkateWeb, :verified_routes

  def init(default), do: default

  def call(conn, _default) do
    conn
    |> fetch_session()
    |> put_session(:post_auth_return_to, request_url(conn))
  end

  @doc """
  Returns the path that was previously set in the `:post_auth_return_to` cookie,
  so that the auth_controller.ex can redirect there upon successful auth.

  ## Example

      iex> conn = conn_for_path(~p"/detours")
      ...>        |> SkateWeb.Plugs.CaptureAuthReturnPath.call(nil)
      ...>
      iex> SkateWeb.Plugs.CaptureAuthReturnPath.get_post_auth_return_to_path(conn)
      ~p"/detours"

  Defaults to ~p"/" if the plug hasn't been invoked.

  ## Example

      iex> conn = conn_for_path(~p"/detours")
      ...>
      iex> SkateWeb.Plugs.CaptureAuthReturnPath.get_post_auth_return_to_path(conn)
      ~p"/"
  """
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
