defmodule Realtime.DataStatusPubSubTest do
  use ExUnit.Case, async: true

  alias Realtime.DataStatusPubSub

  setup do
    start_supervised({Registry, keys: :duplicate, name: Realtime.Supervisor.registry_name()})
    {:ok, pid} = DataStatusPubSub.start_link([])
    %{pid: pid}
  end

  describe "update" do
    test "can call update", %{pid: pid} do
      assert DataStatusPubSub.update(:outage, pid) == :ok
    end
  end

  describe "subscribe" do
    test "clients get data_status upon subscribing", %{pid: pid} do
      :ok = DataStatusPubSub.update(:good, pid)
      assert DataStatusPubSub.subscribe(pid) == :good
    end

    test "clients get updates pushed to them", %{pid: pid} do
      :ok = DataStatusPubSub.update(:good, pid)
      _ = DataStatusPubSub.subscribe(pid)
      :ok = DataStatusPubSub.update(:outage, pid)
      assert_receive {:new_data_status, :outage}
    end
  end

  describe "backend implementation" do
    test "handles reference info calls that come in after a timeout" do
      state = %DataStatusPubSub{}
      response = DataStatusPubSub.handle_info({make_ref(), []}, state)
      assert response == {:noreply, state}
    end
  end
end
