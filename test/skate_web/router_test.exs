defmodule SkateWeb.RouterTest do
  use SkateWeb.ConnCase

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

  describe "GET /docs" do
    test "GET /agency-policies/aup, should return :skate, :acceptable_use_policy", %{conn: conn} do
      conn = get(conn, "/docs/agency-policies/aup")

      assert redirected_to(conn) == Application.get_env(:skate, :acceptable_use_policy)
    end
  end
end
