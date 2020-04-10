defmodule SkateWeb.HealthController do
  @moduledoc """
  Simple controller to return 200 OK when the website is healthy.
  """
  use SkateWeb, :controller

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    health_server_pid =
      conn.assigns[:health_server_pid] || Schedule.Health.Server.default_server()

    if Schedule.Health.Server.ready?(health_server_pid) do
      send_resp(conn, :ok, "")
    else
      send_resp(conn, :service_unavailable, "")
    end
  end
end
