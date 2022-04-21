defmodule SkateWeb.AuthManagerTest do
  use SkateWeb.ChannelCase
  alias Guardian.Phoenix.Socket
  alias SkateWeb.AuthManager
  alias SkateWeb.UserSocket

  describe "username_from_socket!/1" do
    test "extracts the username from the given socket's token" do
      {:ok, token, _claims} = AuthManager.encode_and_sign("charlie")

      {:ok, socket} =
        UserSocket
        |> socket("charlie", %{})
        |> Socket.authenticate(AuthManager, token)

      assert(AuthManager.username_from_socket!(socket) == "charlie")
    end
  end

  describe "claims_access_level/1" do
    test "grants admin access if in the group" do
      assert AuthManager.claims_access_level(%{"groups" => ["skate-admin"]}) == :admin
    end

    test "grants general access if not in the admin group" do
      assert AuthManager.claims_access_level(%{"groups" => ["other-group"]}) == :general
    end

    test "grants general access if no group information present" do
      assert AuthManager.claims_access_level(%{}) == :general
    end
  end

  describe "claims_grant_dispatcher_access?/1" do
    test "grants dispatcher access when in dispatcher group" do
      assert AuthManager.claims_grant_dispatcher_access?(%{"groups" => ["skate-dispatcher"]})
    end

    test "doesn't grant access with nil groups" do
      refute AuthManager.claims_grant_dispatcher_access?(%{"groups" => nil})
    end

    test "doesn't grant access with non-dispatcher groups" do
      refute AuthManager.claims_grant_dispatcher_access?(%{"groups" => ["other-group"]})
    end

    test "doesn't grant access with no group information present" do
      refute AuthManager.claims_grant_dispatcher_access?(%{})
    end
  end

  describe "claims_grant_nav_beta_access?/1" do
    test "grants nav_beta access when in nav beta group" do
      assert AuthManager.claims_grant_nav_beta_access?(%{"groups" => ["skate-nav-beta"]})
    end

    test "doesn't grant access with nil groups" do
      refute AuthManager.claims_grant_nav_beta_access?(%{"groups" => nil})
    end

    test "doesn't grant access with non-nav beta groups" do
      refute AuthManager.claims_grant_nav_beta_access?(%{"groups" => ["other-group"]})
    end

    test "doesn't grant access with no group information present" do
      refute AuthManager.claims_grant_nav_beta_access?(%{})
    end
  end
end
