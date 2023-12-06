defmodule SkateWeb.UnauthorizedController do
  use SkateWeb, :controller

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    conn
    |> put_status(403)
    |> render("index.html", layout: {SkateWeb.LayoutView, "barebones.html"})

    # |> render("index.html", layout: [html: {SkateWeb.LayoutView, :barebones}])
  end

  def restricted_environment(conn, _params) do
    conn
    |> put_status(403)
    |> render("restricted_environment.html", layout: {SkateWeb.LayoutView, "barebones.html"})

    # |> render("restricted_environment.html", layout: [html: {SkateWeb.LayoutView, :barebones}])
  end
end
