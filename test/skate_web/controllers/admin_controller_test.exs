defmodule SkateWeb.AdminControllerTest do
  use SkateWeb.ConnCase

  describe "index/2" do
    @tag :authenticated
    test "when not an admin, redirects to unauthorized page", %{conn: conn} do
      conn = get(conn, ~p"/admin")

      assert redirected_to(conn) == ~p"/unauthorized"
    end

    @tag :authenticated_admin
    test "returns page with tools listed", %{conn: conn} do
      conn = get(conn, ~p"/admin")

      assert html_response(conn, 200) =~ "Admin Tools"
      assert html_response(conn, 200) =~ "Test Groups"
      assert html_response(conn, 200) =~ "Reports"
    end
  end
end
