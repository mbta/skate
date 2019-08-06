defmodule SkateWeb.RouterTest do
  use SkateWeb.ConnCase
  import Test.Support.Helpers

  alias SkateWeb.AuthManager

  describe "GET /_flags" do
    setup do
      reassign_env(
        :skate,
        :refresh_token_store,
        SkateWeb.RouterTest.FakeRefreshTokenStore
      )
    end

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

  defmodule FakeRefreshTokenStore do
    def get_refresh_token(_), do: nil
  end
end
