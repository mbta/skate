defmodule SkateWeb.ChannelAuthTest do
  use SkateWeb.ChannelCase
  import Test.Support.Helpers

  alias SkateWeb.{AuthManager, ChannelAuth, UserSocket}

  setup do
    socket = socket(UserSocket, "", %{})

    {:ok, %{socket: socket, resource: %{id: 1}}}
  end

  describe "valid_token?/1" do
    test "returns true when socket is authenticated", %{
      socket: socket,
      resource: resource
    } do
      {:ok, token, claims} =
        AuthManager.encode_and_sign(resource, %{
          "exp" => System.system_time(:second) + 500
        })

      socket = Guardian.Phoenix.Socket.assign_rtc(socket, resource, token, claims)

      assert ChannelAuth.valid_token?(socket) == true
    end

    test "returns false when socket is not authenticated", %{
      socket: socket,
      resource: resource
    } do
      {:ok, token, claims} =
        AuthManager.encode_and_sign(resource, %{
          "exp" => System.system_time(:second) - 100
        })

      socket =
        Guardian.Phoenix.Socket.assign_rtc(socket, "test-not-authed@mbta.com", token, claims)

      assert ChannelAuth.valid_token?(socket) == false
    end

    test "uses :valid_token_fn when present in application env", %{socket: socket} do
      assert ChannelAuth.valid_token?(socket) == false

      reassign_env(:skate, :valid_token_fn, fn _socket -> true end)
      assert ChannelAuth.valid_token?(socket) == true

      reassign_env(:skate, :valid_token_fn, fn _socket -> false end)
      assert ChannelAuth.valid_token?(socket) == false

      reassign_env(:skate, :valid_token_fn, fn _socket -> true end)
      assert ChannelAuth.valid_token?(socket) == true
    end
  end
end
