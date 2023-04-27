defmodule SkateWeb.AuthManager.ErrorHandlerTest do
  use SkateWeb.ConnCase

  describe "auth_error/3" do
    test "redirects to Cognito login with two remaining retries", %{conn: conn} do
      conn =
        conn
        |> init_test_session(%{username: "test_without_refresh_token@mbta.com"})
        |> SkateWeb.AuthManager.ErrorHandler.auth_error({:some_type, :reason}, [])

      assert html_response(conn, 302) =~ "\"/auth/cognito\""
      assert get_session(conn, :auth_retries) == 2
    end

    test "redirects to Cognito login, decrementing retry count if present", %{conn: conn} do
      conn =
        conn
        |> init_test_session(%{username: "test_without_refresh_token@mbta.com"})
        |> put_session(:auth_retries, 2)
        |> SkateWeb.AuthManager.ErrorHandler.auth_error({:some_type, :reason}, [])

      assert html_response(conn, 302) =~ "\"/auth/cognito\""
      assert get_session(conn, :auth_retries) == 1
    end

    test "sends unauthorized response if out of retries", %{conn: conn} do
      conn =
        conn
        |> init_test_session(%{username: "test_without_refresh_token@mbta.com"})
        |> put_session(:auth_retries, 0)
        |> SkateWeb.AuthManager.ErrorHandler.auth_error({:some_type, :reason}, [])

      assert response(conn, 401) =~ "unauthorized"
      assert is_nil(get_session(conn, :auth_retries))
    end
  end
end
