defmodule SkateWeb.AuthControllerTest do
  use SkateWeb.ConnCase
  import ExUnit.CaptureLog
  import Test.Support.Helpers

  describe "GET /auth/:provider" do
    test "redirects to the callback", %{conn: conn} do
      conn = get(conn, "/auth/cognito")

      assert redirected_to(conn) == "/auth/cognito/callback"
    end
  end

  describe "GET /auth/:provider/callback" do
    setup do
      reassign_env(
        :skate,
        :refresh_token_store,
        SkateWeb.AuthControllerTest.FakeRefreshTokenStore
      )
    end

    test "redirects to the index page for an ueberauth auth", %{conn: conn} do
      mock_auth = %Ueberauth.Auth{
        uid: "test@mbta.com",
        credentials: %Ueberauth.Auth.Credentials{
          expires_at: System.system_time(:second) + 1_000,
          refresh_token: "test_refresh_token",
          other: %{groups: ["test1"]}
        }
      }

      log =
        capture_log(fn ->
          conn =
            conn
            |> assign(:ueberauth_auth, mock_auth)
            |> get("/auth/cognito/callback")

          assert redirected_to(conn) == "/"
          assert Guardian.Plug.current_claims(conn)["groups"] == ["test1"]
        end)

      assert log =~ "stored_refresh_token username=test@mbta.com refresh_token=test_refresh_token"
    end

    test "redirects home for an ueberauth failure", %{conn: conn} do
      log =
        capture_log(fn ->
          conn =
            conn
            |> init_test_session(%{username: "test@mbta.com"})
            |> assign(:ueberauth_failure, "failed")
            |> get("/auth/cognito/callback")

          assert redirected_to(conn) == "/"
        end)

      assert log =~ "cleared_refresh_token username=test@mbta.com"
    end
  end

  defmodule FakeRefreshTokenStore do
    require Logger

    def put_refresh_token(username, refresh_token) do
      Logger.warn("stored_refresh_token username=#{username} refresh_token=#{refresh_token}")
    end

    def clear_refresh_token(username) do
      Logger.warn("cleared_refresh_token username=#{username}")
    end
  end
end
