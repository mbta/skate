defmodule SkateWeb.RouterTest do
  use SkateWeb.ConnCase
  use Skate.DataCase

  describe "GET /" do
    @tag :authenticated
    test "shows you the app", %{conn: conn} do
      conn = get(conn, "/")

      assert html_response(conn, 200) =~ "div id=\"app\""
    end
  end

  describe "GET /search (client-side route)" do
    @tag :authenticated
    test "shows you the app, letting the client handle routing", %{conn: conn} do
      conn = get(conn, "/search")

      assert html_response(conn, 200) =~ "div id=\"app\""
    end
  end

  describe "GET /settings (client-side route)" do
    @tag :authenticated
    test "shows you the app, letting the client handle routing", %{conn: conn} do
      conn = get(conn, "/settings")

      assert html_response(conn, 200) =~ "div id=\"app\""
    end
  end

  describe "GET /_flags" do
    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      conn = get(conn, "/_flags")

      assert redirected_to(conn) == "/auth/cognito"
    end

    @tag :authenticated
    test "when logged in, forwards to Laboratory.Router", %{conn: conn} do
      conn = get(conn, "/_flags")

      assert html_response(conn, 200) =~ "<div class=\"window-title\">Features</div>"
    end
  end
end
