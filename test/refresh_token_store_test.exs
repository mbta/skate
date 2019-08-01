defmodule RefreshTokenStoreTest do
  use ExUnit.Case, async: true

  describe "start_link/0" do
    test "starts up and lives" do
      {:ok, server} = RefreshTokenStore.start_link(name: :start_link)

      Process.sleep(10)

      assert Process.alive?(server)
    end
  end

  describe "put_refresh_token" do
    setup do
      {:ok, server} = RefreshTokenStore.start_link(name: :put_refresh_token)

      {:ok, server: server}
    end

    test "stores the token for the username in the state", %{server: server} do
      assert RefreshTokenStore.put_refresh_token("testuser", "testtoken", server) == :ok

      assert %{"testuser" => "testtoken"} = :sys.get_state(server)
    end
  end

  describe "get_refresh_token" do
    setup do
      {:ok, server} = RefreshTokenStore.start_link(name: :get_refresh_token)

      {:ok, server: server}
    end

    test "gets the refresh token for this username from the state", %{server: server} do
      :sys.replace_state(server, fn _state -> %{"user1" => "token1"} end)

      assert RefreshTokenStore.get_refresh_token("user1", server) == "token1"
    end
  end

  describe "clear_refresh_token" do
    setup do
      {:ok, server} = RefreshTokenStore.start_link(name: :clear_refresh_token)

      {:ok, server: server}
    end

    test "deletes the token for this username from the state", %{server: server} do
      :sys.replace_state(server, fn _state -> %{"user1" => "token1", "user2" => "token2"} end)

      assert RefreshTokenStore.clear_refresh_token("user1", server) == :ok

      assert :sys.get_state(server) == %{"user2" => "token2"}
    end
  end
end
