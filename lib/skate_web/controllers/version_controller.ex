defmodule SkateWeb.VersionController do
  use SkateWeb, :controller

  def version(conn, _params) do
    conn
    |> put_resp_content_type("text/plain")
    |> send_resp(:ok, Application.get_env(:skate, :version))
  end
end
