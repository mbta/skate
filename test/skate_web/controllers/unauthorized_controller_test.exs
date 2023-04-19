defmodule SkateWeb.UnauthorizedControllerTest do
  use SkateWeb.ConnCase

  describe "index/2" do
    @tag :authenticated
    test "renders response", %{conn: conn} do
      conn = get(conn, SkateWeb.Router.Helpers.unauthorized_path(conn, :index))

      assert html_response(conn, 403) =~ "not authorized"
    end
  end

  describe "restricted_environment/2" do
    @tag :authenticated
    test "renders test environment message", %{conn: conn} do
      conn = get(conn, SkateWeb.Router.Helpers.unauthorized_path(conn, :restricted_environment))

      assert html_response(conn, 403) =~
               "The URL you followed is actually for Skate's test environment"
    end
  end
end
