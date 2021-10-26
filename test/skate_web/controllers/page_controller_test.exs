defmodule SkateWeb.PageControllerTest do
  use SkateWeb.ConnCase
  use Skate.DataCase

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
    test "includes route tabs in HTML", %{conn: conn, user: user} do
      user
      |> Skate.Settings.RouteTab.create()
      |> Skate.Settings.RouteTab.set(%{selected_route_ids: ["1"]})

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
  end
end
