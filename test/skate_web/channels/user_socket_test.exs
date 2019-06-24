defmodule SkateWeb.UserSocketTest do
  use SkateWeb.ChannelCase

  alias SkateWeb.{AuthManager, UserSocket}

  setup do
    %{socket: socket(UserSocket)}
  end

  describe "connect/2" do
    test "authenticates when a valid token is given", %{socket: socket} do
      current_time = System.system_time(:second)
      expiration_time = current_time + 500

      {:ok, token, _claims} =
        AuthManager.encode_and_sign("foo@mbta.com", %{"exp" => expiration_time})

      assert {:ok, _authed_socket} = UserSocket.connect(%{"token" => token}, socket, %{})
    end

    test "doesn't authenticate when an expired token is given", %{socket: socket} do
      current_time = System.system_time(:second)
      expiration_time = current_time - 100

      {:ok, token, _claims} =
        AuthManager.encode_and_sign("foo@mbta.com", %{"exp" => expiration_time})

      assert UserSocket.connect(%{"token" => token}, socket, %{}) == :error
    end

    test "doesn't authenticate without a token", %{socket: socket} do
      assert UserSocket.connect(%{"token" => nil}, socket, %{}) == :error
    end
  end
end
