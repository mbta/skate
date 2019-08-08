defmodule RefreshTokenStore.StoreTest do
  use ExUnit.Case, async: true

  alias RefreshTokenStore.Store

  @store %Store{}
         |> Map.put("user1", "token1")
         |> Map.put("user2", "token2")

  describe "put_refresh_token/3" do
    test "adds the token for a new username" do
      username = "user3"
      token = "token3"

      new_store = Store.put_refresh_token(@store, username, token)

      assert new_store[username] == token
    end

    test "updates the token for an existing username" do
      username = "user2"
      token = "newtoken2"

      new_store = Store.put_refresh_token(@store, username, token)

      assert new_store[username] == token
    end
  end

  describe "get_refresh_token/2" do
    test "returns the token saved for the username" do
      assert Store.get_refresh_token(@store, "user1") == "token1"
    end

    test "returns nil if the username isn't found" do
      assert Store.get_refresh_token(@store, "user3") == nil
    end
  end

  describe "clear_refresh_token/2" do
    test "deletes the token from the state and returns the state" do
      new_store = Store.clear_refresh_token(@store, "user1")

      assert new_store["user1"] == nil
    end
  end

  describe "fetch/2 (for Access behaviour)" do
    test "returns the token saved for the username" do
      assert Store.fetch(@store, "user1") == {:ok, "token1"}
    end

    test "returns error if the username isn't found" do
      assert Store.fetch(@store, "user3") == :error
    end
  end

  describe "pop/2 (for Access behaviour)" do
    test "returns the token saved for the username and the new store without the username" do
      expected_new_store =
        %Store{}
        |> Map.put("user2", "token2")

      assert Store.pop(@store, "user1") == {"token1", expected_new_store}
    end

    test "returns nil and the origional store if the username isn't found" do
      assert Store.pop(@store, "user3") == {nil, @store}
    end
  end

  describe "get_and_update/3 (for Access behaviour)" do
    test "returns the token saved for the username and an update store with the update applied" do
      expected_new_store =
        %Store{}
        |> Map.put("user1", "token1-updated")
        |> Map.put("user2", "token2")

      assert Store.get_and_update(@store, "user1", fn token -> {token, "#{token}-updated"} end) ==
               {"token1", expected_new_store}
    end
  end
end
