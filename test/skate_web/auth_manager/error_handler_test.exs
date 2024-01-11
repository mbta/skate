defmodule SkateWeb.AuthManager.ErrorHandlerTest do
  use SkateWeb.ConnCase

  describe "auth_error/3" do
    test "redirects to Keycloak login", %{conn: conn} do
      conn =
        conn
        |> init_test_session(%{username: "test@mbta.com"})
        |> SkateWeb.AuthManager.ErrorHandler.auth_error({:some_type, :reason}, [])

      assert response(conn, :found) =~ ~p"/auth/keycloak"
    end
  end
end
