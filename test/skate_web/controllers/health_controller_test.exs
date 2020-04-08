defmodule SkateWeb.HealthControllerTest do
  use SkateWeb.ConnCase
  import Test.Support.Helpers

  describe "index" do
    test "returns 200 when health server is ready", %{conn: conn} do
      reassign_env(:skate, :checker_healthy_fn, fn -> true end)
      health_server_pid = Schedule.HealthServer.start_mocked()
      Schedule.HealthServer.loaded(health_server_pid)
      conn = Plug.Conn.assign(conn, :health_server_pid, health_server_pid)
      response = get(conn, Routes.health_path(conn, :index))
      assert response.status == 200
    end

    test "returns 503 when health server is not ready", %{conn: conn} do
      health_server_pid = Schedule.HealthServer.start_mocked()
      conn = Plug.Conn.assign(conn, :health_server_pid, health_server_pid)
      response = get(conn, Routes.health_path(conn, :index))
      assert response.status == 503
    end

    test "uses the default health server", %{conn: conn} do
      start_supervised({Schedule.HealthServer, []})
      response = get(conn, Routes.health_path(conn, :index))
      # No Schedule server points to this health server, so it won't be ready
      assert response.status == 503
    end
  end
end
