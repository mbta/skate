defmodule SkateWeb.PageControllerTest do
  use SkateWeb.ConnCase

  alias SkateWeb.AuthManager

  describe "GET /" do
    test "when logged out, redirects you to cognito auth", %{conn: conn} do
      conn = get(conn, "/")

      assert redirected_to(conn) == "/auth/cognito"
    end

    test "when logged in, shows you the app", %{conn: conn} do
      {:ok, token, _} = AuthManager.encode_and_sign(%{})

      conn =
        conn
        |> put_req_header("authorization", "bearer: " <> token)
        |> get("/")

      assert html_response(conn, 200) =~ "div id=\"app\""
    end
  end
end
