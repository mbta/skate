defmodule SkateWeb.EnsureSignsUiGroupTest do
  use SkateWeb.ConnCase

  describe "init/1" do
    test "passes options through unchanged" do
      assert SkateWeb.EnsureAdminGroup.init([]) == []
    end
  end

  describe "call/2" do
    @tag :authenticated_admin
    test "does nothing when user is in the skate-admin group", %{conn: conn} do
      assert conn == SkateWeb.EnsureAdminGroup.call(conn, [])
    end

    @tag :authenticated
    test "redirects when user is not in the signs-ui-admin group", %{conn: conn} do
      conn = SkateWeb.EnsureAdminGroup.call(conn, [])

      response = html_response(conn, 302)
      assert response =~ "/unauthorized"
    end
  end
end
