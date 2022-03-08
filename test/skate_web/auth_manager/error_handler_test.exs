defmodule SkateWeb.AuthManager.ErrorHandlerTest do
  use SkateWeb.ConnCase
  use Plug.Test

  describe "auth_error/3" do
    test "redirects to Cognito login", %{conn: conn} do
      conn =
        conn
        |> init_test_session(%{username: "test_without_refresh_token@mbta.com"})
        |> SkateWeb.AuthManager.ErrorHandler.auth_error({:some_type, :reason}, [])

      assert html_response(conn, 302) =~ "\"/auth/cognito\""
    end
  end
end
