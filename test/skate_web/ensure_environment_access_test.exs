defmodule SkateWeb.EnsureEnvironmentAccessTest do
  use SkateWeb.ConnCase
  import Test.Support.Helpers

  describe "init/1" do
    test "passes options through unchanged" do
      assert SkateWeb.EnsureEnvironmentAccess.init([]) == []
    end
  end

  describe "call/2" do
    @tag :authenticated
    test "redirects when environment is restricted and user is not an admin", %{conn: conn} do
      reassign_env(:skate, :restrict_environment_access?, true)

      conn = SkateWeb.EnsureEnvironmentAccess.call(conn, [])

      assert redirected_to(conn) == "/restricted"
    end

    @tag :authenticated_admin
    test "does nothing when environment is restricted and user is an admin", %{conn: conn} do
      reassign_env(:skate, :restrict_environment_access?, true)

      assert conn == SkateWeb.EnsureEnvironmentAccess.call(conn, [])
    end

    @tag :authenticated
    test "does nothing when environment is not restricted", %{conn: conn} do
      conn = SkateWeb.EnsureEnvironmentAccess.call(conn, [])

      assert conn == SkateWeb.EnsureEnvironmentAccess.call(conn, [])
    end
  end
end
