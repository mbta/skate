defmodule SkateWeb.TestGroupControllerTest do
  use SkateWeb.ConnCase

  alias Skate.Settings.User
  alias Skate.Settings.TestGroup

  describe "index/2" do
    @tag :authenticated
    test "when not an admin, redirects to unauthorized page", %{conn: conn} do
      conn = conn |> get(SkateWeb.Router.Helpers.test_group_path(conn, :index))

      assert redirected_to(conn) == SkateWeb.Router.Helpers.unauthorized_path(conn, :index)
    end

    @tag :authenticated_admin
    test "returns page with test groups listed", %{conn: conn, user: user_name} do
      user = User.get(user_name)

      test_group = TestGroup.create("test group name")

      TestGroup.update(%{test_group | users: [user]})

      conn = get(conn, SkateWeb.Router.Helpers.test_group_path(conn, :index))

      assert html_response(conn, 200) =~ "test group name"
    end
  end
end
