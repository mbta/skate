defmodule SkateWeb.Redirect do
  @moduledoc """
  Controller that redirects to the `:external` `opts` when `call/2`-ed.

  ---

  Reference: https://www.viget.com/articles/how-to-redirect-from-the-phoenix-router/
  """
  import Phoenix.Controller, only: [redirect: 2]

  @spec init(Keyword.t()) :: Keyword.t()
  def init([external: _] = opts), do: opts
  def init(_default), do: raise("Missing required external: option in redirect")

  @spec call(Plug.Conn.t(), Keyword.t()) :: Plug.Conn.t()
  def call(conn, external: url) do
    redirect(conn, external: url)
  end
end
