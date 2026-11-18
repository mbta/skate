defmodule SkateWeb.RadioChannelTest do
  use SkateWeb.ChannelCase

  import Test.Support.Helpers

  alias Skate.Radio.Store
  alias SkateWeb.{RadioChannel, UserSocket}

  setup do
    reassign_env(:skate, :valid_token_fn, fn _socket -> true end)

    if Process.whereis(Store) do
      Store.reset_all()
    end

    %{socket: socket(UserSocket, "", %{})}
  end

  test "joins collection and individual topics and pushes updates", %{socket: socket} do
    for type <- Store.types() do
      assert {:ok, %{data: %{}}, _} = subscribe_and_join(socket, "radio:#{type}")
      assert {:ok, %{data: nil}, _} = subscribe_and_join(socket, "radio:#{type}:1")

      entity = %{"status" => "active"}
      Store.set(type, "1", entity)

      assert {:ok, %{data: %{"1" => ^entity}}, _} =
               subscribe_and_join(socket, "radio:#{type}")

      assert {:ok, %{data: ^entity}, _} =
               subscribe_and_join(socket, "radio:#{type}:1")

      {:ok, _, _} = subscribe_and_join(socket, "radio:#{type}")
      {:ok, _, _} = subscribe_and_join(socket, "radio:#{type}:1")

      replacement = %{"status" => "updated"}
      Store.set(type, "1", replacement)

      assert_push("radio_updated", %{data: %{"1" => ^replacement}})
      assert_push("radio_updated", %{data: ^replacement})
    end
  end

  test "pushes nil when an individual radio entity is deleted", %{socket: socket} do
    Store.set("rtts", "1", %{"status" => "active"})
    {:ok, _, _} = subscribe_and_join(socket, "radio:rtts:1")

    Store.delete("rtts", "1")

    assert_push("radio_updated", %{data: nil})
  end

  test "rejects unsupported and malformed topics", %{socket: socket} do
    for topic <- ["radio", "radio:unknown", "radio:rtts:", "radio:rtts:1:extra"] do
      assert {:error, %{message: "no such topic \"#{topic}\""}} ==
               subscribe_and_join(socket, RadioChannel, topic)
    end
  end

  test "rejects unauthenticated subscriptions", %{socket: socket} do
    reassign_env(:skate, :valid_token_fn, fn _socket -> false end)

    for type <- Store.types(), topic <- ["radio:#{type}", "radio:#{type}:1"] do
      assert {:error, %{reason: :not_authenticated}} = subscribe_and_join(socket, topic)
    end
  end

  test "stops delivering updates when authentication expires", %{socket: socket} do
    {:ok, _, socket} = subscribe_and_join(socket, "radio:rtts")
    monitor = Process.monitor(socket.channel_pid)
    reassign_env(:skate, :valid_token_fn, fn _socket -> false end)

    Store.set("rtts", "1", %{"status" => "active"})
    assert_push("auth_expired", %{})
    assert_receive {:DOWN, ^monitor, :process, _, :normal}
    refute_push("radio_updated", _)
  end
end
