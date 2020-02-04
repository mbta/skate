defmodule SkateWeb.ChannelAuthTest do
  use SkateWeb.ChannelCase
  import Test.Support.Helpers

  alias SkateWeb.{AuthManager, ChannelAuth, UserSocket}

  setup do
    socket = socket(UserSocket, "", %{guardian_default_resource: "test_uid"})

    {:ok, socket: socket}
  end

  describe "handle_info/2" do
    setup do
      reassign_env(
        :skate,
        :refresh_token_store,
        __MODULE__.FakeRefreshTokenStore
      )
    end

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

    test "refreshes the authentication using the refresh token if we have one", %{
      socket: socket
    } do
      {:ok, token, claims} =
        AuthManager.encode_and_sign("test-expired@mbta.com", %{
          "exp" => System.system_time(:second) - 100
        })

      socket = Guardian.Phoenix.Socket.assign_rtc(socket, "test-expired@mbta.com", token, claims)

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

  defmodule FakeRefreshTokenStore do
    def get_refresh_token("test-expired@mbta.com") do
      {:ok, token, _claims} =
        AuthManager.encode_and_sign(
          "test-expired@mbta.com",
          %{
            "exp" => System.system_time(:second) + 500
          },
          token_type: "refresh"
        )

      token
    end

    def get_refresh_token(_), do: nil
  end
end
