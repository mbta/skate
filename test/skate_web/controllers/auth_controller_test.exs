defmodule SkateWeb.AuthControllerTest do
  use SkateWeb.ConnCase
  alias Skate.Settings.User

  describe "GET /auth/:provider" do
    test "redirects to the callback", %{conn: conn} do
      conn = get(conn, "/auth/keycloak")

      assert redirected_to(conn) == "/auth/keycloak/callback"
    end
  end

  describe "GET /auth/:provider/callback" do
    test "redirects to the index page for an ueberauth auth", %{conn: conn} do
      mock_auth = %Ueberauth.Auth{
        uid: "test_username",
        credentials: %Ueberauth.Auth.Credentials{
          expires_at: System.system_time(:second) + 1_000,
          refresh_token: "test_refresh_token"
        },
        info: %{email: "test@mbta.com"},
        extra: %Ueberauth.Auth.Extra{
          raw_info: %UeberauthOidcc.RawInfo{
            userinfo: %{
              "resource_access" => %{
                "test-client" => %{"roles" => ["test1"]}
              }
            }
          }
        }
      }

      conn =
        conn
        |> assign(:ueberauth_auth, mock_auth)
        |> get("/auth/keycloak/callback")

      assert redirected_to(conn) == "/"
      assert Guardian.Plug.current_claims(conn)["groups"] == ["test1"]
    end

    test "creates user record if it doesn't already exist", %{conn: conn} do
      mock_auth = %Ueberauth.Auth{
        uid: "test_username",
        credentials: %Ueberauth.Auth.Credentials{
          expires_at: System.system_time(:second) + 1_000,
          refresh_token: "test_refresh_token"
        },
        info: %{email: "test@mbta.com"},
        extra: %Ueberauth.Auth.Extra{
          raw_info: %UeberauthOidcc.RawInfo{}
        }
      }

      conn
      |> assign(:ueberauth_auth, mock_auth)
      |> get("/auth/keycloak/callback")

      assert %{username: "test_username", email: "test@mbta.com"} =
               User.get_by_email("test@mbta.com")
    end

    test "resets auth retries count on a successful auth", %{conn: conn} do
      mock_auth = %Ueberauth.Auth{
        uid: "test_username",
        credentials: %Ueberauth.Auth.Credentials{
          expires_at: System.system_time(:second) + 1_000,
          refresh_token: "test_refresh_token"
        },
        info: %{email: "test@mbta.com"},
        extra: %Ueberauth.Auth.Extra{
          raw_info: %UeberauthOidcc.RawInfo{}
        }
      }

      conn =
        conn
        |> init_test_session(%{})
        |> put_session(:auth_retries, 2)
        |> assign(:ueberauth_auth, mock_auth)
        |> get("/auth/keycloak/callback")

      assert is_nil(get_session(conn, :auth_retries))
    end

    test "redirects home for an ueberauth failure", %{conn: conn} do
      conn =
        conn
        |> init_test_session(%{username: "test_username"})
        |> assign(:ueberauth_failure, "failed")
        |> get("/auth/keycloak/callback")

      assert redirected_to(conn) == "/"
    end
  end
end
