defmodule SkateWeb.AuthControllerTest do
  use SkateWeb.ConnCase
  alias Skate.Settings.User

  describe "GET /auth/:provider" do
    test "redirects to the callback", %{conn: conn} do
      conn = get(conn, ~p"/auth/keycloak")

      assert redirected_to(conn) == ~p"/auth/keycloak/callback"
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
                "test-client" => %{"roles" => ["test1", "skate-readonly"]}
              }
            }
          }
        }
      }

      conn =
        conn
        |> assign(:ueberauth_auth, mock_auth)
        |> get(~p"/auth/keycloak/callback")

      assert redirected_to(conn) == "/"
      assert Guardian.Plug.current_claims(conn)["groups"] == ["test1", "skate-readonly"]
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
          raw_info: %UeberauthOidcc.RawInfo{
            userinfo: %{
              "resource_access" => %{
                "test-client" => %{"roles" => ["skate-readonly"]}
              }
            }
          }
        }
      }

      conn
      |> assign(:ueberauth_auth, mock_auth)
      |> get(~p"/auth/keycloak/callback")

      assert %{username: "test_username", email: "test@mbta.com"} =
               User.get_by_email("test@mbta.com")
    end

    test "sends forbidden response if the user is authenticated but not in the readonly role", %{
      conn: conn
    } do
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
        |> assign(:ueberauth_auth, mock_auth)
        |> get(~p"/auth/keycloak/callback")

      assert response(conn, :forbidden) == "forbidden"
    end

    test "sends unauthenticated response on ueberauth failure", %{conn: conn} do
      conn =
        conn
        |> init_test_session(%{username: "test_username"})
        |> assign(:ueberauth_failure, "failed")
        |> get(~p"/auth/keycloak/callback")

      assert response(conn, :unauthorized) == "unauthenticated"
    end
  end
end
