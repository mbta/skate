defmodule Skate.Ueberauth.Strategy.FakeTest do
  use SkateWeb.ConnCase

  alias Skate.Ueberauth.Strategy.Fake
  alias Ueberauth.Auth.{Credentials, Extra, Info}

  @tag :authenticated
  test "credentials returns a credentials struct with groups specified in config", %{conn: conn} do
    assert conn |> get(~p"/auth/keycloak") |> Fake.credentials() == %Credentials{
             token: "fake_access_token",
             refresh_token: "fake_refresh_token",
             expires: true,
             expires_at: System.system_time(:second) + 9 * 60 * 60
           }
  end

  test "info returns an empty Info struct" do
    assert Fake.info(%{}) == %Info{email: "fake@email.com"}
  end

  test "extra returns an Extra struct with group membership information", %{conn: conn} do
    assert conn |> get(~p"/auth/keycloak") |> Fake.extra() == %Extra{
             raw_info: %UeberauthOidcc.RawInfo{
               userinfo: %{
                 "resource_access" => %{
                   "dev-client" => %{
                     "roles" => ["skate-dispatcher", "skate-nav-beta"]
                   }
                 }
               }
             }
           }
  end
end
