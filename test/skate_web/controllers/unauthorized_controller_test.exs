defmodule SkateWeb.UnauthorizedControllerTest do
  use SkateWeb.ConnCase

  describe "index/2" do
    @tag :authenticated
    test "renders response", %{conn: conn} do
      conn = get(conn, SkateWeb.Router.Helpers.unauthorized_path(conn, :index))

      assert html_response(conn, 403) =~ "not authorized"
    end
  end
end
