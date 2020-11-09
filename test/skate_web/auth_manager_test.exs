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
end
