defmodule SkateWeb.UnauthorizedController do
  use SkateWeb, :controller

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    conn
    |> put_status(403)
    |> render(:index, layout: {SkateWeb.Layouts, "barebones.html"})
  end

  def restricted_environment(conn, _params) do
    conn
    |> put_status(403)
    |> render(:restricted_environment, layout: {SkateWeb.Layouts, "barebones.html"})
  end
end
