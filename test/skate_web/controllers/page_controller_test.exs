defmodule SkateWeb.PageControllerTest do
  use SkateWeb.ConnCase
  use Skate.DataCase
  import Test.Support.Helpers

  describe "GET /" do
    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      conn = get(conn, "/")

      assert redirected_to(conn) == "/auth/cognito"
    end

    @tag :authenticated
    test "when logged in, shows you the app", %{conn: conn} do
      conn = get(conn, "/")

      assert html_response(conn, 200) =~ "div id=\"app\""
    end

    @tag :authenticated
    test "assigns the username", %{conn: conn, user: user} do
      conn = get(conn, "/")

      assert conn.assigns.username == user
    end

    @tag :authenticated
    test "swings beta defaults to disabled", %{conn: conn} do
      conn = get(conn, "/")

      assert html_response(conn, 200) =~ "data-enable-swings-beta=\"false\""
    end

    @tag :authenticated
    test "sets the swings beta as enabled", %{conn: conn, user: user} do
      reassign_env(:skate, :swings_beta_usernames, user)

      conn = get(conn, "/")

      assert html_response(conn, 200) =~ "data-enable-swings-beta=\"true\""
    end

    @tag :authenticated
    test "/settings returns 200", %{conn: conn} do
      conn = get(conn, "/settings")

      assert html_response(conn, 200) =~ "div id=\"app\""
    end

    @tag :authenticated
    test "/shuttle-map returns 200", %{conn: conn} do
      conn = get(conn, "/shuttle-map")

      assert html_response(conn, 200) =~ "div id=\"app\""
    end
  end
end
