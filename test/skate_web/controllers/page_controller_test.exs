defmodule SkateWeb.PageControllerTest do
  use SkateWeb.ConnCase
  import Skate.Factory
  import Test.Support.Helpers

  describe "GET /" do
    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      conn = get(conn, "/")

      assert redirected_to(conn) == "/auth/cognito"
    end

    @tag :authenticated
    test "when logged in but restricted from environment, redirects to restriction page", %{
      conn: conn
    } do
      reassign_env(:skate, :restrict_environment_access?, true)
      conn = get(conn, "/")

      assert redirected_to(conn) == "/restricted"
    end

    @tag :authenticated_admin
    test "when logged as admin in restricted from environment, shows user the app", %{
      conn: conn
    } do
      reassign_env(:skate, :restrict_environment_access?, true)
      conn = get(conn, "/")

      assert html_response(conn, 200) =~ "div id=\"app\""
    end

    @tag :authenticated
    test "when logged in, shows you the app", %{conn: conn} do
      conn = get(conn, "/")

      assert html_response(conn, 200) =~ "div id=\"app\""
    end

    @tag :authenticated
    test "assigns the username", %{conn: conn, user: user} do
      conn = get(conn, "/")

      assert conn.assigns.username == user.username
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
      Skate.Settings.RouteTab.update_all_for_user!(user.id, [
        build(:route_tab, %{selected_route_ids: ["1"]})
      ])

      conn = get(conn, "/")

      html = html_response(conn, 200)

      assert html =~ "data-route-tabs"
      assert html =~ "selected_route_ids&quot;:[&quot;1&quot;]"
    end

    @tag :authenticated
    test "includes user test groups in HTML", %{conn: conn, user: user} do
      Skate.Settings.TestGroup.update(%{
        Skate.Settings.TestGroup.create("html-test-group")
        | users: [user]
      })

      user_struct =
        user.id |> Skate.Settings.User.get_by_id!() |> Skate.Repo.preload(:test_groups)

      conn = get(conn, "/")

      html = html_response(conn, 200)

      json =
        user_struct.test_groups
        |> Enum.map(& &1.name)
        |> Jason.encode!()
        |> Phoenix.HTML.html_escape()
        |> Phoenix.HTML.safe_to_string()

      assert html =~ "data-user-test-groups=\"#{json}\""
    end

    @tag :authenticated
    test "includes fullstory snippet when record_fullstory is true", %{conn: conn} do
      reassign_env(:skate, :record_fullstory, true)
      conn = get(conn, "/")

      html = html_response(conn, 200)

      assert html =~ "<script>\nwindow['_fs_host'] = 'fullstory.com';"
    end

    @tag :authenticated
    test "doesn't contain fullstory snippet when record_fullstory is false", %{conn: conn} do
      reassign_env(:skate, :record_fullstory, false)
      conn = get(conn, "/")

      html = html_response(conn, 200)

      refute html =~ "<script>\nwindow['_fs_host'] = 'fullstory.com';"
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
    test "correct sentry environment set", %{conn: conn} do
      reassign_env(:skate, :record_sentry, true)
      reassign_env(:skate, :sentry_environment, "test_env")

      conn = get(conn, "/")
      assert html_response(conn, 200) =~ "environment: \"test_env\""
    end

    @tag :authenticated
    test "correct tileset url set", %{conn: conn} do
      reassign_env(:skate, :tileset_url, "tilesets.com/osm")

      conn = get(conn, "/")
      assert html_response(conn, 200) =~ "data-tileset-url=\"tilesets.com/osm\""
    end

    @tag :authenticated
    test "correct username set", %{conn: conn} do
      conn = get(conn, "/")
      assert html_response(conn, 200) =~ "<meta name=\"username\" content=\"test_user\">"
    end

    @tag :authenticated
    test "includes UUID in HTML", %{conn: conn, user: user} do
      user_struct = Skate.Settings.User.get_by_id!(user.id)

      conn = get(conn, "/")

      assert html_response(conn, 200) =~
               "<meta name=\"user-uuid\" content=\"#{user_struct.uuid}\">"
    end

    @tag :authenticated
    test "correct tag manager ID set", %{conn: conn} do
      reassign_env(:skate, :google_tag_manager_id, "test_id")

      html = conn |> get("/") |> html_response(200)

      assert html =~ ~r/<script>.*test_id.*<\/script>/s
      assert html =~ ~r/<noscript>.*test_id.*<\/noscript>/s
    end
  end
end
