defmodule SkateWeb.AdminControllerTest do
  use SkateWeb.ConnCase

  describe "index/2" do
    @tag :authenticated
    test "when not an admin, redirects to unauthorized page", %{conn: conn} do
      conn = get(conn, SkateWeb.Router.Helpers.admin_path(conn, :index))

      assert redirected_to(conn) == SkateWeb.Router.Helpers.unauthorized_path(conn, :index)
    end

    @tag :authenticated_admin
    test "returns page with tools listed", %{conn: conn} do
      conn = get(conn, SkateWeb.Router.Helpers.admin_path(conn, :index))

      assert html_response(conn, 200) =~ "Admin Tools"
      assert html_response(conn, 200) =~ "Test Groups"
      assert html_response(conn, 200) =~ "Reports"
      assert html_response(conn, 200) =~ "Feature Flags"
    end
  end
end
