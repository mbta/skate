defmodule Realtime.BlockOverloadStoreTest do
  use ExUnit.Case
  import Test.Support.Helpers

  alias Realtime.BlockOverloadStore

  @fake_vehicle_1 %{
    block_id: "block1",
    vehicle_id: "y1234"
  }

  @fake_vehicle_2 %{
    block_id: "block2",
    vehicle_id: "y2345"
  }

  describe "start_link" do
    test "starts and lives" do
      {:ok, server} = BlockOverloadStore.start_link(name: :start_link)
      Process.sleep(10)
      assert Process.alive?(server)
    end
  end

  describe "handle_cast" do
    test "when state is not yet set, sets state but sends empty list to notification server" do
      my_pid = self()
      reassign_env(:skate, :new_block_overloads_fn, &send(my_pid, &1))

      assert BlockOverloadStore.handle_cast(
               {:update, [@fake_vehicle_1, @fake_vehicle_2]},
               nil
             ) == {:noreply, [@fake_vehicle_1, @fake_vehicle_2]}

      assert_receive([])
    end

    test "when state is already set, sets state and sends new block overloads to notification server" do
      my_pid = self()
      reassign_env(:skate, :new_block_overloads_fn, &send(my_pid, &1))

      assert BlockOverloadStore.handle_cast(
               {:update, [@fake_vehicle_1, @fake_vehicle_2]},
               [@fake_vehicle_1]
             ) == {:noreply, [@fake_vehicle_1, @fake_vehicle_2]}

      assert_receive([%{block_id: "block2", vehicle_id: "y2345"}])
    end
  end
end
