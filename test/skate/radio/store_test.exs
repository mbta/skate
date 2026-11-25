defmodule Skate.Radio.StoreTest do
  use ExUnit.Case

  alias Skate.Radio.Store

  setup do
    store = start_supervised!({Store, name: __MODULE__})
    %{store: store}
  end

  test "stores, replaces, and publishes updates for every radio type", %{store: store} do
    for type <- Store.types() do
      Agent.update(store, fn _ -> Map.new(Store.types(), &{&1, %{}}) end)

      entity = %{"status" => "active"}
      replacement = %{"status" => "updated"}

      assert Store.all(type, store) == %{}
      assert Store.get(type, "1", store) == nil

      Phoenix.PubSub.subscribe(Skate.PubSub, "radio:#{type}")
      Phoenix.PubSub.subscribe(Skate.PubSub, "radio:#{type}:1")

      assert :ok = Store.set(type, "1", entity, store)
      assert Store.get(type, "1", store) == entity
      assert_receive {:radio_updated, _, %{"1" => ^entity}}
      assert_receive {:radio_updated, _, ^entity}

      assert :ok = Store.set(type, "1", replacement, store)
      assert Store.all(type, store) == %{"1" => replacement}
      assert_receive {:radio_updated, _, %{"1" => ^replacement}}
      assert_receive {:radio_updated, _, ^replacement}

      for other_type <- Store.types() -- [type] do
        assert Store.all(other_type, store) == %{}
      end
    end
  end

  test "identifies collection notifications for different radio types", %{store: store} do
    Phoenix.PubSub.subscribe(Skate.PubSub, "radio:rtts")
    Phoenix.PubSub.subscribe(Skate.PubSub, "radio:calls")
    entity = %{"status" => "active"}

    Store.set("rtts", "1", entity, store)
    Store.set("calls", "1", entity, store)

    assert_receive {:radio_updated, "radio:rtts", %{"1" => ^entity}}
    assert_receive {:radio_updated, "radio:calls", %{"1" => ^entity}}
  end

  test "deletes and resets radio entities", %{store: store} do
    Phoenix.PubSub.subscribe(Skate.PubSub, "radio:rtts")
    Phoenix.PubSub.subscribe(Skate.PubSub, "radio:rtts:1")

    Store.set("rtts", "1", %{"status" => "active"}, store)
    assert_receive {:radio_updated, "radio:rtts", %{"1" => _}}
    assert_receive {:radio_updated, "radio:rtts:1", %{"status" => "active"}}

    assert :ok = Store.delete("rtts", "1", store)
    assert Store.get("rtts", "1", store) == nil
    assert_receive {:radio_updated, "radio:rtts", %{}}
    assert_receive {:radio_updated, "radio:rtts:1", nil}

    Store.set("rtts", "1", %{"status" => "active"}, store)
    assert_receive {:radio_updated, "radio:rtts", %{"1" => _}}
    assert_receive {:radio_updated, "radio:rtts:1", %{"status" => "active"}}

    assert :ok = Store.reset("rtts", store)
    assert Store.all("rtts", store) == %{}
    assert_receive {:radio_updated, "radio:rtts", %{}}

    Store.set("rtts", "1", %{"status" => "active"}, store)
    Phoenix.PubSub.subscribe(Skate.PubSub, "radio:calls")
    Phoenix.PubSub.subscribe(Skate.PubSub, "radio:calls:1")
    Phoenix.PubSub.subscribe(Skate.PubSub, "radio:prtts")
    Phoenix.PubSub.subscribe(Skate.PubSub, "radio:emergencies")

    Store.set("calls", "1", %{"status" => "active"}, store)
    assert_receive {:radio_updated, "radio:rtts", %{"1" => _}}
    assert_receive {:radio_updated, "radio:rtts:1", %{"status" => "active"}}
    assert_receive {:radio_updated, "radio:calls", %{"1" => _}}
    assert_receive {:radio_updated, "radio:calls:1", %{"status" => "active"}}

    assert :ok = Store.reset_all(store)

    for type <- Store.types() do
      assert Store.all(type, store) == %{}
    end

    assert_receive {:radio_updated, "radio:rtts", %{}}
    assert_receive {:radio_updated, "radio:prtts", %{}}
    assert_receive {:radio_updated, "radio:emergencies", %{}}
    assert_receive {:radio_updated, "radio:calls", %{}}
  end
end
