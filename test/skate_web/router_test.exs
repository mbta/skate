defmodule SkateWeb.RouterTest do
  use SkateWeb.ConnCase
  use Skate.DataCase

  alias SkateWeb.AuthManager

  describe "GET /" do
    test "shows you the app", %{conn: conn} do
      {:ok, token, _} = AuthManager.encode_and_sign("FAKE_UID")

      conn =
        conn
        |> put_req_header("authorization", "bearer: " <> token)
        |> get("/")

      assert html_response(conn, 200) =~ "div id=\"app\""
    end
  end

  describe "GET /search (client-side route)" do
    test "shows you the app, letting the client handle routing", %{conn: conn} do
      {:ok, token, _} = AuthManager.encode_and_sign("FAKE_UID")

      conn =
        conn
        |> put_req_header("authorization", "bearer: " <> token)
        |> get("/search")

      assert html_response(conn, 200) =~ "div id=\"app\""
    end
  end

  describe "GET /settings (client-side route)" do
    test "shows you the app, letting the client handle routing", %{conn: conn} do
      {:ok, token, _} = AuthManager.encode_and_sign("FAKE_UID")

      conn =
        conn
        |> put_req_header("authorization", "bearer: " <> token)
        |> get("/settings")

      assert html_response(conn, 200) =~ "div id=\"app\""
    end
  end

  describe "GET /_flags" do
    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      conn = get(conn, "/_flags")

      assert redirected_to(conn) == "/auth/cognito"
    end

    test "when logged in, forwards to Laboratory.Router", %{conn: conn} do
      {:ok, token, _} = AuthManager.encode_and_sign(%{})

      conn =
        conn
        |> put_req_header("authorization", "bearer: " <> token)
        |> get("/_flags")

      assert html_response(conn, 200) =~ "<div class=\"window-title\">Features</div>"
    end
  end
end
