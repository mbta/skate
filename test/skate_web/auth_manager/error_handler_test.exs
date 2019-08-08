defmodule SkateWeb.AuthManager.ErrorHandlerTest do
  use SkateWeb.ConnCase
  use Plug.Test
  import Test.Support.Helpers

  setup do
    reassign_env(
      :skate,
      :refresh_token_store,
      SkateWeb.AuthManager.ErrorHandlerTest.FakeRefreshTokenStore
    )
  end

  describe "auth_error/3" do
    test "redirects to Cognito login if there's no refresh key", %{conn: conn} do
      conn =
        conn
        |> init_test_session(%{username: "test_without_refresh_token@mbta.com"})
        |> SkateWeb.AuthManager.ErrorHandler.auth_error({:some_type, :reason}, [])

      assert html_response(conn, 302) =~ "\"/auth/cognito\""
    end

    test "redirects to Cognito callback if there is a refresh key", %{conn: conn} do
      conn =
        conn
        |> init_test_session(%{username: "test_with_refresh_token@mbta.com"})
        |> SkateWeb.AuthManager.ErrorHandler.auth_error({:some_type, :reason}, [])

      assert html_response(conn, 302) =~ "\"/auth/cognito/callback\?"
    end
  end

  defmodule FakeRefreshTokenStore do
    def get_refresh_token("test_without_refresh_token@mbta.com"), do: nil
    def get_refresh_token("test_with_refresh_token@mbta.com"), do: "abcde"
  end
end
