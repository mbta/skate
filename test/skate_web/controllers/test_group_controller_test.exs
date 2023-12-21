defmodule SkateWeb.TestGroupControllerTest do
  use SkateWeb.ConnCase

  alias Skate.Settings.User
  alias Skate.Settings.TestGroup

  describe "index/2" do
    @tag :authenticated
    test "when not an admin, redirects to unauthorized page", %{conn: conn} do
      conn = get(conn, ~p"/test_groups")

      assert redirected_to(conn) == ~p"/unauthorized"
    end

    @tag :authenticated_admin
    test "returns page with test groups listed", %{conn: conn, user: user} do
      {:ok, test_group} = TestGroup.create("test group name")

      TestGroup.update(%{test_group | users: [user]})

      conn = get(conn, ~p"/test_groups")

      assert html_response(conn, 200) =~ "test group name"
    end
  end

  describe "post/2" do
    @tag :authenticated
    test "when not an admin, redirects to unauthorized page", %{conn: conn} do
      conn = post(conn, ~p"/test_groups/create")

      assert redirected_to(conn) == ~p"/unauthorized"
    end

    @tag :authenticated_admin
    test "creates test group on submit", %{conn: conn} do
      conn =
        post(conn, ~p"/test_groups/create", %{
          "test_group" => %{
            "name" => "group to create"
          }
        })

      assert redirected_to(conn) == ~p"/test_groups"

      assert [%TestGroup{name: "group to create"}] = TestGroup.get_all()
    end

    @tag :authenticated_admin
    test "gives a reasonable error message when trying to create a group with no name", %{
      conn: conn
    } do
      conn =
        post(conn, ~p"/test_groups/create", %{
          "test_group" => %{
            "name" => ""
          }
        })

      html_response(conn, 400) =~ "Test group name is required"

      assert Enum.empty?(TestGroup.get_all())
    end

    @tag :authenticated_admin
    test "gives a reasonable error message when trying to create a group with a duplicate name",
         %{
           conn: conn
         } do
      TestGroup.create("duplicate group")

      conn =
        post(conn, ~p"/test_groups/create", %{
          "test_group" => %{
            "name" => "duplicate group"
          }
        })

      html_response(conn, 400) =~ "Test group name has been taken"

      assert Enum.count(TestGroup.get_all()) == 1
    end
  end

  describe "show/2" do
    @tag :authenticated
    test "when not an admin, redirects to unauthorized page", %{conn: conn} do
      conn = get(conn, ~p"/test_groups/1")

      assert redirected_to(conn) == ~p"/unauthorized"
    end

    @tag :authenticated_admin
    test "renders a test group", %{conn: conn, user: user} do
      {:ok, test_group} = TestGroup.create("group to show")
      test_group_with_user = TestGroup.update(%TestGroup{test_group | users: [user]})

      html =
        conn
        |> get(~p"/test_groups/#{test_group_with_user.id}")
        |> html_response(200)

      assert html =~ "group to show"
      assert html =~ user.email
    end

    @tag :authenticated_admin
    test "includes a button for setting the enabled override", %{conn: conn} do
      {:ok, test_group} = TestGroup.create("group to show")

      html =
        conn
        |> get(~p"/test_groups/#{test_group.id}")
        |> html_response(200)

      assert html =~ "Enable for all users"
      refute html =~ "Remove override"
    end

    @tag :skip
    @tag :authenticated_admin
    test "includes a button for removing the override when the override is already there", %{
      conn: conn
    } do
      {:ok, test_group} = TestGroup.create("group to show")
      test_group = TestGroup.update(%{test_group | override: :enabled})

      html =
        conn
        |> get(~p"/test_groups/#{test_group.id}")
        |> html_response(200)

      refute html =~ "Enable for all users"
      assert html =~ "Remove override"
    end

    @tag :authenticated_admin
    test "returns 404 when no test group found", %{conn: conn} do
      conn = get(conn, ~p"/test_groups/123")

      assert response(conn, 404) =~ "no test group found"
    end
  end

  describe "add_user_form/2" do
    @tag :authenticated
    test "when not an admin, redirects to unauthorized page", %{conn: conn} do
      conn = get(conn, ~p"/test_groups/1/add_user")

      assert redirected_to(conn) == ~p"/unauthorized"
    end

    @tag :authenticated_admin
    test "renders form, including users that can be added but not users already in group", %{
      conn: conn
    } do
      user1 = User.upsert("user1", "user1@test.com")
      user2 = User.upsert("user2", "user2@test.com")

      {:ok, test_group} = TestGroup.create("group to add users to")
      test_group_with_user = TestGroup.update(%TestGroup{test_group | users: [user1]})

      html =
        conn
        |> get(~p"/test_groups/#{test_group_with_user.id}/add_user")
        |> html_response(200)

      refute html =~ user1.email
      assert html =~ user2.email
    end

    @tag :authenticated_admin
    test "returns 404 when no test group found", %{conn: conn} do
      conn = get(conn, ~p"/test_groups/123/add_user")

      assert response(conn, 404) =~ "no test group found"
    end
  end

  describe "add_user/2" do
    @tag :authenticated
    test "when not an admin, redirects to unauthorized page", %{conn: conn} do
      conn = get(conn, ~p"/test_groups/1/add_user")

      assert redirected_to(conn) == ~p"/unauthorized"
    end

    @tag :authenticated_admin
    test "adds user to test group", %{conn: conn} do
      user = User.upsert("user", "user@test.com")

      {:ok, test_group} = TestGroup.create("group to add user to")

      conn =
        post(conn, ~p"/test_groups/#{test_group.id}/add_user", %{
          "user_id" => user.id
        })

      assert redirected_to(conn) == ~p"/test_groups/#{test_group.id}"

      updated_test_group = TestGroup.get(test_group.id)

      assert updated_test_group.users == [user]
    end

    @tag :authenticated_admin
    test "handles case where no test group is found", %{conn: conn} do
      conn =
        post(conn, ~p"/test_groups/123/add_user", %{
          "user_id" => "456"
        })

      assert response(conn, 404) =~ "no test group found"
    end

    @tag :authenticated_admin
    test "handles case where no user is found", %{conn: conn} do
      {:ok, test_group} = TestGroup.create("group to add user to")

      conn =
        post(conn, ~p"/test_groups/#{test_group.id}/add_user", %{
          "user_id" => 123
        })

      assert response(conn, 400) =~ "no user found"
    end
  end

  describe "remove_user/2" do
    @tag :authenticated
    test "when not an admin, redirects to unauthorized page", %{conn: conn} do
      conn = post(conn, ~p"/test_groups/1/remove_user")

      assert redirected_to(conn) == ~p"/unauthorized"
    end

    @tag :authenticated_admin
    test "removes user from the group", %{conn: conn} do
      user1 = User.upsert("user1", "user1@test.com")
      user2 = User.upsert("user2", "user2@test.com")

      {:ok, test_group} = TestGroup.create("test group")
      test_group_with_users = TestGroup.update(%TestGroup{test_group | users: [user1, user2]})

      conn =
        post(conn, ~p"/test_groups/#{test_group.id}/remove_user", %{
          "user_id" => Integer.to_string(user2.id)
        })

      assert %TestGroup{users: [^user1]} = TestGroup.get(test_group_with_users.id)

      assert redirected_to(conn) ==
               ~p"/test_groups/#{test_group_with_users.id}"
    end

    @tag :authenticated_admin
    test "handles case where user is not in group", %{conn: conn} do
      user1 = User.upsert("user1", "user1@test.com")
      user2 = User.upsert("user2", "user2@test.com")

      {:ok, test_group} = TestGroup.create("test group")
      TestGroup.update(%TestGroup{test_group | users: [user1]})

      conn =
        post(conn, ~p"/test_groups/#{test_group.id}/remove_user", %{
          "user_id" => Integer.to_string(user2.id)
        })

      assert response(conn, 400) =~ "user not found in test group"
    end

    @tag :authenticated_admin
    test "handles case where test group is not found", %{conn: conn} do
      conn =
        post(conn, ~p"/test_groups/123/remove_user", %{
          "user_id" => "456"
        })

      assert response(conn, 404) =~ "no test group found"
    end
  end

  describe "delete/2" do
    @tag :authenticated
    test "when not an admin, redirects to unauthorized page", %{conn: conn} do
      conn = get(conn, ~p"/test_groups")

      assert redirected_to(conn) == ~p"/unauthorized"
    end

    @tag :authenticated_admin
    test "redirects to test groups index page", %{conn: conn} do
      {:ok, test_group} = TestGroup.create("test group")
      conn = delete(conn, ~p"/test_groups/#{test_group.id}")

      assert redirected_to(conn) == ~p"/test_groups"
    end

    @tag :authenticated_admin
    test "deletes the test group", %{conn: conn} do
      {:ok, test_group} = TestGroup.create("test group")
      delete(conn, ~p"/test_groups/#{test_group.id}")

      assert Enum.empty?(TestGroup.get_all())
    end
  end

  describe "enable_override/2" do
    @tag :authenticated_admin
    test "redirects to the test group page", %{conn: conn} do
      {:ok, test_group} = TestGroup.create("test group")
      conn = post(conn, ~p"/test_groups/#{test_group.id}/enable_override")

      assert redirected_to(conn) == ~p"/test_groups/#{test_group.id}"
    end

    @tag :skip
    @tag :authenticated_admin
    test "sets the override to enabled", %{conn: conn} do
      {:ok, test_group} = TestGroup.create("test group")
      post(conn, ~p"/test_groups/#{test_group.id}/enable_override")

      test_group = TestGroup.get(test_group.id)
      assert test_group.override == :enabled
    end
  end

  describe "remove_override/2" do
    @tag :skip
    @tag :authenticated_admin
    test "redirects to the test group page", %{conn: conn} do
      {:ok, test_group} = TestGroup.create("test group")
      test_group = TestGroup.update(%{test_group | override: :enabled})
      conn = post(conn, ~p"/test_groups/#{test_group.id}/remove_override")

      assert redirected_to(conn) == ~p"/test_groups/#{test_group.id}"
    end

    @tag :skip
    @tag :authenticated_admin
    test "sets the override to :none", %{conn: conn} do
      {:ok, test_group} = TestGroup.create("test group")
      test_group = TestGroup.update(%{test_group | override: :enabled})
      post(conn, ~p"/test_groups/#{test_group.id}/remove_override")

      test_group = TestGroup.get(test_group.id)
      assert test_group.override == :none
    end
  end
end
