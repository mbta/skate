defmodule SkateWeb.PageControllerTest do
  use SkateWeb.ConnCase
  use Skate.DataCase
  import Skate.Factory
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
    test "doesn't set dispatcher flag when not logged in as a dispatcher", %{conn: conn} do
      conn = get(conn, "/")

      refute conn.assigns.dispatcher_flag
    end

    @tag :authenticated_dispatcher
    test "does set dispatcher flag when logged in as a dispatcher", %{conn: conn} do
      conn = get(conn, "/")

      assert conn.assigns.dispatcher_flag
    end

    @tag :authenticated
    test "doesn't set nav beta flag when not in nav beta group", %{conn: conn} do
      conn = get(conn, "/")

      refute conn.assigns.nav_beta_flag
    end

    @tag :authenticated_nav_beta
    test "does set nav beta flag when in nav beta group", %{conn: conn} do
      conn = get(conn, "/")

      assert conn.assigns.nav_beta_flag
    end

    @tag :authenticated
    test "includes route tabs in HTML", %{conn: conn, user: user} do
      Skate.Settings.RouteTab.update_all_for_user!(user, [
        build(:route_tab, %{selected_route_ids: ["1"]})
      ])

      conn = get(conn, "/")

      html = html_response(conn, 200)

      assert html =~ "data-route-tabs"
      assert html =~ "selected_route_ids&quot;:[&quot;1&quot;]"
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

    @tag :authenticated
    setup do
      reassign_env(:skate, :record_sentry, true)
      reassign_env(:skate, :sentry_environment, "test_env")
    end

    test "correct sentry environment set", %{conn: conn} do
      conn = get(conn, "/")

      assert html_response(conn, 200) =~ "environment: \"test_env\""
    end
  end
end
