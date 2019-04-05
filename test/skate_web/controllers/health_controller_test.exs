defmodule SkateWeb.HealthControllerTest do
  use SkateWeb.ConnCase

  describe "index" do
    test "returns 200 when health server is ready", %{conn: conn} do
      health_server_pid = Gtfs.HealthServer.start_mocked()
      Gtfs.HealthServer.loaded(health_server_pid)
      conn = Plug.Conn.assign(conn, :health_server_pid, health_server_pid)
      response = get(conn, Routes.health_path(conn, :index))
      assert response.status == 200
    end

    test "returns 503 when health server is not ready", %{conn: conn} do
      health_server_pid = Gtfs.HealthServer.start_mocked()
      conn = Plug.Conn.assign(conn, :health_server_pid, health_server_pid)
      response = get(conn, Routes.health_path(conn, :index))
      assert response.status == 503
    end

    test "uses the default health server", %{conn: conn} do
      # The real gtfs data takes longer to load than the tests take to run.
      # So it won't be ready
      response = get(conn, Routes.health_path(conn, :index))
      assert response.status == 503
    end
  end
end
