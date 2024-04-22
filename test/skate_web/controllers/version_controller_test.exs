defmodule SkateWeb.VersionControllerTest do
  use SkateWeb.ConnCase
  import Test.Support.Helpers

  describe "GET /" do
    @tag :authenticated_admin
    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      reassign_env(:skate, :version, "test-version")
      conn = get(conn, "/version")

      assert response(conn, 200) == "test-version"
    end
  end
end
