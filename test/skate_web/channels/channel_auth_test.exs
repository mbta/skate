defmodule SkateWeb.ChannelAuthTest do
  use SkateWeb.ChannelCase

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

    # test "when token expires, user should not be able to see data from skate", do end
    # test "when token expires, user should not be able to subscribe to more topics", do end
  end
end
