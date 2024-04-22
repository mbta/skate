defmodule SkateWeb.VersionController do
  use SkateWeb, :controller

  def version(conn, _params) do
    send_resp(conn, 200, Application.get_env(:skate, :version))
  end
end
