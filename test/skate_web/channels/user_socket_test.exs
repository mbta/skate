defmodule SkateWeb.UserSocketTest do
  use SkateWeb.ChannelCase

  alias SkateWeb.{AuthManager, UserSocket}

  import Test.Support.Helpers
  import ExUnit.CaptureLog

  setup do
    %{socket: socket(UserSocket), resource: %{id: 1}}
  end

  describe "connect/2" do
    test "authenticates when a valid token is given", %{socket: socket, resource: resource} do
      current_time = System.system_time(:second)
      expiration_time = current_time + 500

      {:ok, token, _claims} = AuthManager.encode_and_sign(resource, %{"exp" => expiration_time})

      assert {:ok, _authed_socket} = UserSocket.connect(%{"token" => token}, socket, %{})
    end

    test "doesn't authenticate when an expired token is given", %{
      socket: socket,
      resource: resource
    } do
      current_time = System.system_time(:second)
      expiration_time = current_time - 100

      {:ok, token, _claims} = AuthManager.encode_and_sign(resource, %{"exp" => expiration_time})

      assert UserSocket.connect(%{"token" => token}, socket, %{}) == :error
    end

    test "doesn't authenticate without a token", %{socket: socket} do
      assert UserSocket.connect(%{"token" => nil}, socket, %{}) == :error
    end

    test "doesn't log user token", %{resource: resource} do
      set_log_level(:info)

      current_time = System.system_time(:second)
      expiration_time = current_time + 500

      {:ok, token, _claims} = AuthManager.encode_and_sign(resource, %{"exp" => expiration_time})

      log = capture_log(fn -> connect(UserSocket, %{"token" => token}) end)
      assert log =~ "%{\"token\" => \"[FILTERED]\"}"
    end
  end
end
