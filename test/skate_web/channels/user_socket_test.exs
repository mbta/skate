defmodule SkateWeb.UserSocketTest do
  use SkateWeb.ChannelCase

  alias SkateWeb.{AuthManager, UserSocket}

  import Test.Support.Helpers
  import ExUnit.CaptureLog

  setup do
    %{socket: socket(UserSocket), resource: %{id: 1}}
  end

  describe "connect/2" do
    test "authenticates when a valid token is given and logs", %{
      socket: socket,
      resource: resource
    } do
      set_log_level(:info)

      current_time = System.system_time(:second)
      expiration_time = current_time + 500

      {:ok, token, _claims} =
        AuthManager.encode_and_sign(resource, %{"exp" => expiration_time})

      log =
        capture_log([level: :info], fn ->
          assert {:ok, _authed_socket} = UserSocket.connect(%{"token" => token}, socket, %{})
        end)

      assert log =~ "socket_authenticated user_id=#{resource.id}"
    end

    test "doesn't authenticate when an expired token is given, but does log resource", %{
      socket: socket,
      resource: resource
    } do
      set_log_level(:info)

      current_time = System.system_time(:second)
      expiration_time = current_time - 100

      {:ok, token, _claims} = AuthManager.encode_and_sign(resource, %{"exp" => expiration_time})

      log =
        capture_log([level: :info], fn ->
          assert UserSocket.connect(%{"token" => token}, socket, %{}) == :error
        end)

      assert log =~ "socket_auth_rejected user_id=#{resource.id}"
    end

    test "doesn't authenticate without a token, and doesn't attempt to log user info", %{
      socket: socket
    } do
      set_log_level(:info)

      log =
        capture_log([level: :info], fn ->
          assert UserSocket.connect(%{"token" => nil}, socket, %{}) == :error
        end)

      refute log =~ "socket_auth_rejected"
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
