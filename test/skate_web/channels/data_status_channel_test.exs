defmodule SkateWeb.DataStatusChannelTest do
  use SkateWeb.ChannelCase
  import Test.Support.Helpers

  alias Phoenix.Socket
  alias Realtime.DataStatusPubSub
  alias SkateWeb.DataStatusChannel
  alias SkateWeb.UserSocket

  setup do
    reassign_env(:skate, :valid_token_fn, fn _socket -> true end)

    socket = socket(UserSocket, "", %{})

    start_supervised({Registry, keys: :duplicate, name: Realtime.Supervisor.registry_name()})
    start_supervised({Realtime.DataStatusPubSub, name: Realtime.DataStatusPubSub.default_name()})

    {:ok, socket: socket}
  end

  describe "join/3" do
    test "subscribes to data status", %{socket: socket} do
      :ok = DataStatusPubSub.update(:outage)

      assert {:ok, %{data: :outage}, %Socket{}} =
               subscribe_and_join(socket, DataStatusChannel, "data_status")
    end

    test "returns an error when joining a non-existant topic", %{socket: socket} do
      assert {:error, %{message: "no such topic \"rooms:1\""}} =
               subscribe_and_join(socket, DataStatusChannel, "rooms:1")
    end
  end

  describe "handle_info/2" do
    test "pushes new data onto the socket", %{socket: socket} do
      {:ok, _, socket} = subscribe_and_join(socket, DataStatusChannel, "data_status")

      assert {:noreply, _socket} =
               DataStatusChannel.handle_info(
                 {:new_data_status, :good},
                 socket
               )

      assert_push("data_status", %{data: :good})
    end

    test "rejects sending vehicle data when socket is not authenticated", %{socket: socket} do
      reassign_env(:skate, :valid_token_fn, fn _socket -> false end)

      {:ok, _, socket} = subscribe_and_join(socket, DataStatusChannel, "data_status")

      assert {:stop, :normal, _socket} =
               DataStatusChannel.handle_info(
                 {:new_data_status, :good},
                 socket
               )

      assert_push("auth_expired", _)
    end
  end
end
