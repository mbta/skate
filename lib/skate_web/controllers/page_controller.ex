defmodule SkateWeb.PageController do
  require Logger
  use SkateWeb, :controller
  alias SkateWeb.AuthManager

  def index(conn, _params) do
    uid = AuthManager.Plug.current_resource(conn)
    _ = Logger.info("uid=#{uid}")

    render(conn, "index.html")
  end
end
