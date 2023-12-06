defmodule SkateWeb.UnauthorizedControllerTest do
  use SkateWeb.ConnCase

  describe "index/2" do
    @tag :authenticated
    test "renders response", %{conn: conn} do
      conn = get(conn, ~p"/unauthorized")

      assert html_response(conn, 403) =~ "not authorized"
    end
  end

  describe "restricted_environment/2" do
    @tag :authenticated
    test "renders test environment message", %{conn: conn} do
      conn = get(conn, ~p"/restricted")

      assert html_response(conn, 403) =~
               "The URL you followed is actually for Skate's test environment"
    end
  end
end
