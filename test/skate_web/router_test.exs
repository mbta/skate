defmodule SkateWeb.RouterTest do
  use SkateWeb.ConnCase

  alias SkateWeb.Router

  describe "api_auth/2" do
    test "passes the conn through with a valid token", %{conn: conn} do
      {:ok, token, _} = SkateWeb.AuthManager.encode_and_sign(%{})

      original_conn =
        conn
        |> put_req_header("token", token)

      conn = Router.api_auth(original_conn, %{})

      assert conn == original_conn
    end

    test "responds with unauthorized without a valid token", %{conn: conn} do
      conn = Router.api_auth(conn, %{})

      assert response(conn, 401) == "unauthorized"
    end
  end
end
