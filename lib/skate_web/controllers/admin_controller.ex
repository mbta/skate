defmodule SkateWeb.AdminController do
  @moduledoc """
  Admin-only tools
  """

  use SkateWeb, :controller

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    render(conn, :index,
      layout: {SkateWeb.Layouts, "barebones.html"},
      title: "Skate Admin"
    )
  end
end
