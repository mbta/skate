defmodule Skate.Ueberauth.Strategy.Fake do
  @moduledoc false

  use Ueberauth.Strategy, ignores_csrf_attack: true

  use SkateWeb, :verified_routes

  @impl Ueberauth.Strategy
  def handle_request!(conn) do
    conn
    |> redirect!(~p"/auth/keycloak/callback")
    |> halt()
  end

  @impl Ueberauth.Strategy
  def handle_callback!(conn) do
    conn
  end

  @impl Ueberauth.Strategy
  def uid(_conn) do
    "fake_uid"
  end

  @impl Ueberauth.Strategy
  def credentials(_conn) do
    nine_hours_in_seconds = 9 * 60 * 60
    expiration_time = System.system_time(:second) + nine_hours_in_seconds

    %Ueberauth.Auth.Credentials{
      token: "fake_access_token",
      refresh_token: "fake_refresh_token",
      expires: true,
      expires_at: expiration_time
    }
  end

  @impl Ueberauth.Strategy
  def info(_conn) do
    %Ueberauth.Auth.Info{email: "fake@email.com"}
  end

  @impl Ueberauth.Strategy
  def extra(conn) do
    %Ueberauth.Auth.Extra{
      raw_info: %UeberauthOidcc.RawInfo{
        userinfo: %{
          "resource_access" => %{
            "dev-client" => %{"roles" => Ueberauth.Strategy.Helpers.options(conn)[:groups]}
          }
        }
      }
    }
  end

  @impl Ueberauth.Strategy
  def handle_cleanup!(conn) do
    conn
  end
end
