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
      mock_auth = %{
        uid: "UID",
        credentials: %{
          expires_at: System.system_time(:second) + 1_000
        }
      }

      conn =
        conn
        |> assign(:ueberauth_auth, mock_auth)
        |> get("/auth/cognito/callback")

      assert redirected_to(conn) == "/"
    end

    test "redirects home for an ueberauth failure", %{conn: conn} do
      conn =
        conn
        |> assign(:ueberauth_failure, "failed")
        |> get("/auth/cognito/callback")

      assert redirected_to(conn) == "/"
    end
  end
end
