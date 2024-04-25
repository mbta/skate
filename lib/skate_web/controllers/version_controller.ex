defmodule SkateWeb.VersionController do
  use SkateWeb, :controller

  @version Application.compile_env(:skate, :version)

  def version(conn, _params) do
    conn
    |> put_resp_content_type("text/plain")
    |> send_resp(:ok, @version)
  end
end
