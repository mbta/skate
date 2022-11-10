defmodule SkateWeb.TestGroupControllerTest do
  use SkateWeb.ConnCase

  alias Skate.Settings.User
  alias Skate.Settings.TestGroup

  describe "index/2" do
    @tag :authenticated
    test "when not an admin, redirects to unauthorized page", %{conn: conn} do
      conn = get(conn, SkateWeb.Router.Helpers.test_group_path(conn, :index))

      assert redirected_to(conn) == SkateWeb.Router.Helpers.unauthorized_path(conn, :index)
    end

    @tag :authenticated_admin
    test "returns page with test groups listed", %{conn: conn, user: user} do
      test_group = TestGroup.create("test group name")

      TestGroup.update(%{test_group | users: [user]})

      conn = get(conn, SkateWeb.Router.Helpers.test_group_path(conn, :index))

      assert html_response(conn, 200) =~ "test group name"
    end
  end

  describe "post/2" do
    @tag :authenticated
    test "when not an admin, redirects to unauthorized page", %{conn: conn} do
      conn = post(conn, SkateWeb.Router.Helpers.test_group_path(conn, :post))

      assert redirected_to(conn) == SkateWeb.Router.Helpers.unauthorized_path(conn, :index)
    end

    @tag :authenticated_admin
    test "creates test group on submit", %{conn: conn} do
      conn =
        post(conn, SkateWeb.Router.Helpers.test_group_path(conn, :post), %{
          "name" => "group to create"
        })

      assert redirected_to(conn) == SkateWeb.Router.Helpers.test_group_path(conn, :index)

      assert [%TestGroup{name: "group to create"}] = TestGroup.get_all()
    end
  end

  describe "show/2" do
    @tag :authenticated
    test "when not an admin, redirects to unauthorized page", %{conn: conn} do
      conn = get(conn, SkateWeb.Router.Helpers.test_group_path(conn, :show, "1"))

      assert redirected_to(conn) == SkateWeb.Router.Helpers.unauthorized_path(conn, :index)
    end

    @tag :authenticated_admin
    test "renders a test group", %{conn: conn, user: user} do
      test_group = TestGroup.create("group to show")
      test_group_with_user = TestGroup.update(%TestGroup{test_group | users: [user]})

      html =
        conn
        |> get(SkateWeb.Router.Helpers.test_group_path(conn, :show, test_group_with_user.id))
        |> html_response(200)

      assert html =~ "group to show"
      assert html =~ user.email
    end

    @tag :authenticated_admin
    test "returns 404 when no test group found", %{conn: conn} do
      conn = get(conn, SkateWeb.Router.Helpers.test_group_path(conn, :show, 123))

      assert response(conn, 404) =~ "no test group found"
    end
  end

  describe "add_user_form/2" do
    @tag :authenticated
    test "when not an admin, redirects to unauthorized page", %{conn: conn} do
      conn = get(conn, SkateWeb.Router.Helpers.test_group_path(conn, :add_user_form, "1"))

      assert redirected_to(conn) == SkateWeb.Router.Helpers.unauthorized_path(conn, :index)
    end

    @tag :authenticated_admin
    test "renders form, including users that can be added but not users already in group", %{
      conn: conn
    } do
      user1 = User.upsert("user1", "user1@test.com")
      user2 = User.upsert("user2", "user2@test.com")

      test_group = TestGroup.create("group to add users to")
      test_group_with_user = TestGroup.update(%TestGroup{test_group | users: [user1]})

      html =
        conn
        |> get(
          SkateWeb.Router.Helpers.test_group_path(conn, :add_user_form, test_group_with_user.id)
        )
        |> html_response(200)

      refute html =~ user1.email
      assert html =~ user2.email
    end

    @tag :authenticated_admin
    test "returns 404 when no test group found", %{conn: conn} do
      conn = get(conn, SkateWeb.Router.Helpers.test_group_path(conn, :add_user_form, 123))

      assert response(conn, 404) =~ "no test group found"
    end
  end

  describe "add_user/2" do
    @tag :authenticated
    test "when not an admin, redirects to unauthorized page", %{conn: conn} do
      conn = get(conn, SkateWeb.Router.Helpers.test_group_path(conn, :add_user, "1"))

      assert redirected_to(conn) == SkateWeb.Router.Helpers.unauthorized_path(conn, :index)
    end

    @tag :authenticated_admin
    test "adds user to test group", %{conn: conn} do
      user = User.upsert("user", "user@test.com")

      test_group = TestGroup.create("group to add user to")

      conn =
        post(conn, SkateWeb.Router.Helpers.test_group_path(conn, :add_user, test_group.id), %{
          "user_id" => user.id
        })

      assert redirected_to(conn) ==
               SkateWeb.Router.Helpers.test_group_path(conn, :show, test_group.id)

      updated_test_group = TestGroup.get(test_group.id)

      assert updated_test_group.users == [user]
    end

    @tag :authenticated_admin
    test "handles case where no test group is found", %{conn: conn} do
      conn =
        post(conn, SkateWeb.Router.Helpers.test_group_path(conn, :add_user, 123), %{
          "user_id" => "456"
        })

      assert response(conn, 404) =~ "no test group found"
    end

    @tag :authenticated_admin
    test "handles case where no user is found", %{conn: conn} do
      test_group = TestGroup.create("group to add user to")

      conn =
        post(conn, SkateWeb.Router.Helpers.test_group_path(conn, :add_user, test_group.id), %{
          "user_id" => 123
        })

      assert response(conn, 400) =~ "no user found"
    end
  end

  describe "remove_user/2" do
    @tag :authenticated
    test "when not an admin, redirects to unauthorized page", %{conn: conn} do
      conn = post(conn, SkateWeb.Router.Helpers.test_group_path(conn, :remove_user, "1"))

      assert redirected_to(conn) == SkateWeb.Router.Helpers.unauthorized_path(conn, :index)
    end

    @tag :authenticated_admin
    test "removes user from the group", %{conn: conn} do
      user1 = User.upsert("user1", "user1@test.com")
      user2 = User.upsert("user2", "user2@test.com")

      test_group = TestGroup.create("test group")
      test_group_with_users = TestGroup.update(%TestGroup{test_group | users: [user1, user2]})

      conn =
        post(conn, SkateWeb.Router.Helpers.test_group_path(conn, :remove_user, test_group.id), %{
          "user_id" => Integer.to_string(user2.id)
        })

      assert %TestGroup{users: [^user1]} = TestGroup.get(test_group_with_users.id)

      assert redirected_to(conn) ==
               SkateWeb.Router.Helpers.test_group_path(conn, :show, test_group_with_users.id)
    end

    @tag :authenticated_admin
    test "handles case where user is not in group", %{conn: conn} do
      user1 = User.upsert("user1", "user1@test.com")
      user2 = User.upsert("user2", "user2@test.com")

      test_group = TestGroup.create("test group")
      TestGroup.update(%TestGroup{test_group | users: [user1]})

      conn =
        post(conn, SkateWeb.Router.Helpers.test_group_path(conn, :remove_user, test_group.id), %{
          "user_id" => Integer.to_string(user2.id)
        })

      assert response(conn, 400) =~ "user not found in test group"
    end

    @tag :authenticated_admin
    test "handles case where test group is not found", %{conn: conn} do
      conn =
        post(conn, SkateWeb.Router.Helpers.test_group_path(conn, :remove_user, 123), %{
          "user_id" => "456"
        })

      assert response(conn, 404) =~ "no test group found"
    end
  end
end
