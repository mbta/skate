defmodule SkateWeb.AuthControllerTest do
  use SkateWeb.ConnCase

  import Test.Support.Helpers

  alias Skate.Settings.User

  describe "GET /auth/:provider" do
    test "redirects to the callback", %{conn: conn} do
      conn = get(conn, ~p"/auth/keycloak")

      assert redirected_to(conn) == ~p"/auth/keycloak/callback"
    end
  end

  describe "GET /auth/keycloak/callback" do
    test "redirects to the index page for an ueberauth auth", %{conn: conn} do
      mock_auth = %Ueberauth.Auth{
        provider: :keycloak,
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

    test "redirects to the post_auth_return_to path if available", %{conn: conn} do
      mock_auth = %Ueberauth.Auth{
        provider: :keycloak,
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
        |> init_test_session(%{post_auth_return_to: ~p"/detours"})
        |> get(~p"/auth/keycloak/callback")

      assert redirected_to(conn) == "/detours"
      assert Guardian.Plug.current_claims(conn)["groups"] == ["test1", "skate-readonly"]
    end

    test "creates user record if it doesn't already exist", %{conn: conn} do
      mock_auth = %Ueberauth.Auth{
        provider: :keycloak,
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
        provider: :keycloak,
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
        |> assign(:ueberauth_failure, %{provider: :keycloak})
        |> get(~p"/auth/keycloak/callback")

      assert response(conn, :unauthorized) == "unauthenticated"
    end
  end

  describe "GET /auth/keycloak/logout" do
    test "redirects to `sign_out_url`", %{conn: conn} do
      redirect_url = "redirect.url.localhost"

      reassign_env(:skate, :logout_url_fn, fn _, _ ->
        {:ok, redirect_url}
      end)

      conn =
        conn
        |> init_test_session(%{})
        |> assign(:ueberauth_auth, Skate.Factory.build(:ueberauth_auth))
        |> get(~p"/auth/keycloak/callback")

      assert Guardian.Plug.authenticated?(conn)

      conn = get(conn, ~p"/auth/keycloak/logout")

      refute Guardian.Plug.authenticated?(conn)

      assert redirected_to(conn) == redirect_url
    end

    @tag :authenticated
    test "clears guardian session", %{conn: conn} do
      assert Guardian.Plug.authenticated?(conn)

      conn = get(conn, ~p"/auth/keycloak/logout")

      refute Guardian.Plug.authenticated?(conn)
    end

    @tag :authenticated
    test "clears phoenix session", %{conn: conn} do
      refute %{} == Plug.Conn.get_session(conn)

      conn =
        get(conn, ~p"/auth/keycloak/logout")

      assert %{} == Plug.Conn.get_session(conn)
    end
  end

  describe "GET /auth/cognito/callback" do
    test "redirects to the index page for an ueberauth auth", %{conn: conn} do
      mock_auth = %Ueberauth.Auth{
        provider: :cognito,
        uid: "test_username",
        credentials: %Ueberauth.Auth.Credentials{
          expires_at: System.system_time(:second) + 1_000,
          refresh_token: "test_refresh_token",
          other: %{groups: ["test1"]}
        },
        info: %{email: "test@mbta.com"}
      }

      conn =
        conn
        |> assign(:ueberauth_auth, mock_auth)
        |> get("/auth/cognito/callback")

      assert redirected_to(conn) == "/"
      assert Guardian.Plug.current_claims(conn)["groups"] == ["test1"]
    end

    test "creates user record if it doesn't already exist", %{conn: conn} do
      mock_auth = %Ueberauth.Auth{
        provider: :cognito,
        uid: "test_username",
        credentials: %Ueberauth.Auth.Credentials{
          expires_at: System.system_time(:second) + 1_000,
          refresh_token: "test_refresh_token",
          other: %{groups: ["test1"]}
        },
        info: %{email: "test@mbta.com"}
      }

      conn
      |> assign(:ueberauth_auth, mock_auth)
      |> get("/auth/cognito/callback")

      assert %{username: "test_username", email: "test@mbta.com"} =
               User.get_by_email("test@mbta.com")
    end

    test "resets auth retries count on a successful auth", %{conn: conn} do
      mock_auth = %Ueberauth.Auth{
        provider: :cognito,
        uid: "test_username",
        credentials: %Ueberauth.Auth.Credentials{
          expires_at: System.system_time(:second) + 1_000,
          refresh_token: "test_refresh_token",
          other: %{groups: ["test1"]}
        },
        info: %{email: "test@mbta.com"}
      }

      conn =
        conn
        |> init_test_session(%{})
        |> put_session(:auth_retries, 2)
        |> assign(:ueberauth_auth, mock_auth)
        |> get("/auth/cognito/callback")

      assert is_nil(get_session(conn, :auth_retries))
    end

    test "redirects home for an ueberauth failure", %{conn: conn} do
      conn =
        conn
        |> init_test_session(%{username: "test_username"})
        |> assign(:ueberauth_failure, %{provider: :cognito})
        |> get("/auth/cognito/callback")

      assert redirected_to(conn) == "/"
    end
  end
end
