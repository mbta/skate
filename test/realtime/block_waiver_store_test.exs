defmodule Realtime.BlockWaiverStoreTest do
  use ExUnit.Case, async: true

  alias Realtime.{BlockWaiver, BlockWaiverStore}

  import Test.Support.Helpers

  @block_waivers [
    %BlockWaiver{
      start_time: 10,
      end_time: 20,
      cause_id: 26,
      cause_description: "E - Diverted",
      remark: "E:1106"
    }
  ]
  @block_waivers_by_block_key %{
    {"block1", "service1"} => @block_waivers
  }

  describe "start_link/1" do
    test "starts up and lives" do
      {:ok, server} = BlockWaiverStore.start_link(name: :start_link)

      Process.sleep(10)

      assert Process.alive?(server)
    end
  end

  describe "block_waivers_for_block_and_service/2" do
    setup do
      {:ok, server} = BlockWaiverStore.start_link(name: :block_waivers_for_block_and_service)

      {:ok, server: server}
    end

    test "get the BlockWaivers for the requested block and service", %{server: server} do
      :sys.replace_state(server, fn state ->
        Map.put(
          state,
          :block_waivers_by_block_key,
          @block_waivers_by_block_key
        )
      end)

      assert BlockWaiverStore.block_waivers_for_block_and_service("block1", "service1", server) ==
               @block_waivers
    end

    test "returns an empty list if there are no waivers for the requested block and services", %{
      server: server
    } do
      :sys.replace_state(server, fn state ->
        Map.put(
          state,
          :block_waivers_by_block_key,
          @block_waivers_by_block_key
        )
      end)

      assert BlockWaiverStore.block_waivers_for_block_and_service(
               "missing-block",
               "missing-service",
               server
             ) ==
               []
    end
  end

  describe "set/1" do
    setup do
      {:ok, server} = BlockWaiverStore.start_link(name: :set)

      {:ok, server: server}
    end

    test "stores the StopTimeUpdates by trip ID", %{server: server} do
      assert BlockWaiverStore.set(@block_waivers_by_block_key, server) == :ok

      assert %{block_waivers_by_block_key: @block_waivers_by_block_key} = :sys.get_state(server)
    end

    test "sends new BlockWaivers to the notification server" do
      test_pid = self()

      reassign_env(
        :notifications,
        :notifications_server_new_block_waivers_fn,
        fn waiver_message -> send(test_pid, waiver_message) end
      )

      {:ok, server} = BlockWaiverStore.start_link(name: :send_test)

      # This is the first time we're storing waivers, so no notification.
      block_waivers_by_block_key = @block_waivers_by_block_key
      BlockWaiverStore.set(block_waivers_by_block_key, server)
      refute_received _

      # Called again, but with the same arguments, so the difference
      # between iterations is empty.
      BlockWaiverStore.set(block_waivers_by_block_key, server)
      Process.sleep(10)
      assert_received %{}

      # Called with a waiver added; existing waiver for block ignored.
      new_waiver_1 = %BlockWaiver{
        start_time: 15,
        end_time: 25,
        cause_id: 22,
        cause_description: "Q - Fake",
        remark: "Q:1234"
      }

      block_waivers_by_block_key = %{
        {"block1", "service1"} => [new_waiver_1 | @block_waivers]
      }

      BlockWaiverStore.set(block_waivers_by_block_key, server)
      Process.sleep(10)

      assert_received %{
        {"block1", "service1"} => [new_waiver_1]
      }

      # Two existing waivers continue on, and are not passed to the
      # notification server. Two notifications on two other blocks
      # enter however.

      new_waiver_2 = %BlockWaiver{
        start_time: 35,
        end_time: 45,
        cause_id: 42,
        cause_description: "R - Faker",
        remark: "R:2345"
      }

      new_waiver_3 = %BlockWaiver{
        start_time: 55,
        end_time: 65,
        cause_id: 62,
        cause_description: "S - Fakest",
        remark: "S:3456"
      }

      block_waivers_by_block_key = %{
        {"block1", "service1"} => [new_waiver_1 | @block_waivers],
        {"block2", "service2"} => [new_waiver_2],
        {"block3", "service3"} => [new_waiver_3]
      }

      BlockWaiverStore.set(block_waivers_by_block_key, server)
      Process.sleep(10)

      assert_received %{
        {"block2", "service2"} => [new_waiver_2],
        {"block3", "service3"} => [new_waiver_3]
      }
    end
  end
end
