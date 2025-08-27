defmodule Realtime.StateOfChargeStoreTest do
  use ExUnit.Case, async: true

  alias Realtime.StateOfChargeStore

  @tracked_vehicle_ids ["4200", "4201", "4202"]

  setup do
    {:ok, server} =
      StateOfChargeStore.start_link(tracked_vehicle_ids: @tracked_vehicle_ids, name: :test_store)

    {:ok, server: server}
  end

  test "initializes with tracked vehicle IDs", %{server: server} do
    for vehicle_id <- @tracked_vehicle_ids do
      assert StateOfChargeStore.get(vehicle_id, server) == nil
    end
  end

  test "updates state of charge for a valid vehicle ID", %{server: server} do
    vehicle_id = "4200"
    state_of_charge = %{value: 80, time: 1_672_574_400}

    updated_state = StateOfChargeStore.update(vehicle_id, state_of_charge, server)
    assert updated_state == state_of_charge
    assert StateOfChargeStore.get(vehicle_id, server) == state_of_charge
  end

  test "does not update state of charge for an invalid vehicle ID", %{server: server} do
    invalid_vehicle_id = "9999"
    state_of_charge = %{value: 50, time: 1_672_574_400}

    updated_state = StateOfChargeStore.update(invalid_vehicle_id, state_of_charge, server)
    assert updated_state == nil
    assert StateOfChargeStore.get(invalid_vehicle_id, server) == nil
  end

  test "ignores invalid state_of_charge input", %{server: server} do
    vehicle_id = "4201"

    updated_state =
      StateOfChargeStore.update(vehicle_id, %{value: nil, time: 1_672_574_400}, server)

    assert updated_state == nil
    assert StateOfChargeStore.get(vehicle_id, server) == nil

    updated_state = StateOfChargeStore.update(vehicle_id, %{value: 50, time: nil}, server)
    assert updated_state == nil
    assert StateOfChargeStore.get(vehicle_id, server) == nil
  end
end
