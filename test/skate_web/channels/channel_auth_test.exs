defmodule SkateWeb.ChannelAuthTest do
  use SkateWeb.ChannelCase

  alias SkateWeb.{AuthManager, ChannelAuth, UserSocket}

  setup do
    socket = socket(UserSocket, "", %{guardian_default_resource: "test_uid"})

    {:ok, socket: socket}
  end

  describe "valid_token?/1" do
    test "returns true when socket is authenticated", %{
      socket: socket
    } do
      {:ok, token, claims} =
        AuthManager.encode_and_sign("test-authed@mbta.com", %{
          "exp" => System.system_time(:second) + 500
        })

      socket = Guardian.Phoenix.Socket.assign_rtc(socket, "test-authed@mbta.com", token, claims)

      assert ChannelAuth.valid_token?(socket) == true
    end

    test "returns false when socket is not authenticated", %{
      socket: socket
    } do
      {:ok, token, claims} =
        AuthManager.encode_and_sign("test-not-authed@mbta.com", %{
          "exp" => System.system_time(:second) - 100
        })

      socket =
        Guardian.Phoenix.Socket.assign_rtc(socket, "test-not-authed@mbta.com", token, claims)

      assert ChannelAuth.valid_token?(socket) == false
    end
  end
end
