defmodule SkateWeb.AuthControllerTest do
  use SkateWeb.ConnCase

  describe "GET /auth/:provider" do
    test "redirects to the callback", %{conn: conn} do
      conn = get(conn, "/auth/cognito")

      assert redirected_to(conn) == "/auth/cognito/callback"
    end
  end

  describe "GET /auth/:provider/callback" do
    test "redirects to the index page for an ueberauth auth", %{conn: conn} do
      mock_auth = %Ueberauth.Auth{
        uid: "test@mbta.com",
        credentials: %Ueberauth.Auth.Credentials{
          expires_at: System.system_time(:second) + 1_000,
          refresh_token: "test_refresh_token",
          other: %{groups: ["test1"]}
        }
      }

      conn =
        conn
        |> assign(:ueberauth_auth, mock_auth)
        |> get("/auth/cognito/callback")

      assert redirected_to(conn) == "/"
      assert Guardian.Plug.current_claims(conn)["groups"] == ["test1"]
    end

    test "redirects home for an ueberauth failure", %{conn: conn} do
      conn =
        conn
        |> init_test_session(%{username: "test@mbta.com"})
        |> assign(:ueberauth_failure, "failed")
        |> get("/auth/cognito/callback")

      assert redirected_to(conn) == "/"
    end
  end
end
