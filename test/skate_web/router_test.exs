defmodule SkateWeb.RouterTest do
  use SkateWeb.ConnCase
  import Test.Support.Helpers

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

  describe "GET /_preview/radio/queue (client-side route)" do
    @tag :authenticated
    test "shows you the app when preview routes are enabled", %{conn: conn} do
      reassign_env(:skate, :preview_routes_enabled?, true)
      conn = get(conn, "/_preview/radio/queue")

      assert html_response(conn, 200) =~ "div id=\"app\""
    end

    @tag :authenticated
    test "returns 404 when preview routes are disabled", %{conn: conn} do
      reassign_env(:skate, :preview_routes_enabled?, false)
      conn = get(conn, "/_preview/radio/queue")

      assert html_response(conn, 404) =~ "Not Found"
    end
  end

  describe "GET /docs" do
    test "GET /agency-policies/aup, should return :skate, :acceptable_use_policy", %{conn: conn} do
      conn = get(conn, "/docs/agency-policies/aup")

      assert redirected_to(conn) == Application.get_env(:skate, :acceptable_use_policy)
    end
  end
end
