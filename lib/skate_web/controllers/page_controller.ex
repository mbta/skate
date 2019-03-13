defmodule SkateWeb.PageController do
  use SkateWeb, :controller

  def index(conn, _params) do
    render(conn, "index.html")
  end
end
