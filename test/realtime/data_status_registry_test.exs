defmodule Realtime.DataStatusRegistryTest do
  use ExUnit.Case, async: true

  alias Realtime.DataStatusRegistry

  setup do
    start_supervised({Registry, keys: :duplicate, name: Realtime.Supervisor.registry_name()})
    {:ok, pid} = DataStatusRegistry.start_link([])
    %{pid: pid}
  end

  describe "update" do
    test "can call update", %{pid: pid} do
      assert DataStatusRegistry.update(:outage, pid) == :ok
    end
  end

  describe "subscribe" do
    test "clients get data_status upon subscribing", %{pid: pid} do
      :ok = DataStatusRegistry.update(:good, pid)
      assert DataStatusRegistry.subscribe(pid) == :good
    end

    test "clients get updates pushed to them", %{pid: pid} do
      :ok = DataStatusRegistry.update(:good, pid)
      _ = DataStatusRegistry.subscribe(pid)
      :ok = DataStatusRegistry.update(:outage, pid)
      assert_receive {:new_data_status, :outage}
    end
  end

  describe "backend implementation" do
    test "handles reference info calls that come in after a timeout" do
      state = %DataStatusRegistry{}
      response = DataStatusRegistry.handle_info({make_ref(), []}, state)
      assert response == {:noreply, state}
    end
  end
end
