defmodule SkateWeb.EnsurePreviewRoutesEnabledTest do
  use SkateWeb.ConnCase
  import Test.Support.Helpers

  describe "init/1" do
    test "passes options through unchanged" do
      assert SkateWeb.EnsurePreviewRoutesEnabled.init([]) == []
    end
  end

  describe "call/2" do
    test "does nothing when preview routes are enabled", %{conn: conn} do
      reassign_env(:skate, :preview_routes_enabled?, true)

      assert conn == SkateWeb.EnsurePreviewRoutesEnabled.call(conn, [])
    end

    test "halts and returns 404 when preview routes are disabled", %{conn: conn} do
      reassign_env(:skate, :preview_routes_enabled?, false)

      conn =
        conn
        |> fetch_query_params()
        |> SkateWeb.EnsurePreviewRoutesEnabled.call([])

      assert conn.halted
      assert conn.status == 404
      assert html_response(conn, 404) =~ "Not Found"
    end
  end
end
