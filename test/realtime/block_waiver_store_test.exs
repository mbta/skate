defmodule Realtime.BlockWaiverStoreTest do
  use ExUnit.Case, async: true

  alias Realtime.{BlockWaiver, BlockWaiverStore}

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
  end
end
