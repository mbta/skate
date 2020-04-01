defmodule Realtime.TrainVehiclesPubSubTest do
  use ExUnit.Case, async: true

  alias Realtime.TrainVehiclesPubSub
  alias TrainVehicles.TrainVehicle

  @blue_train_vehicle %TrainVehicle{
    id: "blue1",
    route_id: "Blue",
    latitude: 42.24615,
    longitude: -71.00369,
    bearing: 15
  }
  @red_train_vehicle %TrainVehicle{
    id: "red1",
    route_id: "Red",
    latitude: 42.24615,
    longitude: -71.00369,
    bearing: 15
  }
  @train_vehicles_by_route_id %{
    "Blue" => [@blue_train_vehicle],
    "Red" => [@red_train_vehicle]
  }

  describe "start_link/1" do
    test "starts the server" do
      subscribe_fn = fn _, _ -> :ok end

      assert {:ok, _pid} =
               TrainVehiclesPubSub.start_link(name: :start_link, subscribe_fn: subscribe_fn)
    end
  end

  describe "subscribe/2" do
    setup do
      start_supervised({Registry, keys: :duplicate, name: Realtime.Supervisor.registry_name()})

      subscribe_fn = fn _, _ -> :ok end
      {:ok, server} = TrainVehiclesPubSub.start_link(name: :subscribe, subscribe_fn: subscribe_fn)

      {:ok, server: server}
    end

    test "clients get data_status upon subscribing", %{server: server} do
      :sys.replace_state(server, fn state ->
        Map.put(
          state,
          :train_vehicles_by_route_id,
          @train_vehicles_by_route_id
        )
      end)

      assert TrainVehiclesPubSub.subscribe("Red", server) == @train_vehicles_by_route_id["Red"]
    end
  end

  describe "handle_info/2 - {:reset, train_vehicles}" do
    setup do
      start_supervised({Registry, keys: :duplicate, name: Realtime.Supervisor.registry_name()})
      subscribe_fn = fn _, _ -> :ok end
      {:ok, server} = TrainVehiclesPubSub.start_link(name: :subscribe, subscribe_fn: subscribe_fn)

      :sys.replace_state(server, fn state ->
        Map.put(
          state,
          :train_vehicles_by_route_id,
          %{}
        )
      end)

      {:ok, server: server}
    end

    test "resets the saved train vehicles", %{
      server: server
    } do
      send(server, {:reset, [@blue_train_vehicle, @red_train_vehicle]})

      assert server |> :sys.get_state() |> Map.get(:train_vehicles_by_route_id) ==
               @train_vehicles_by_route_id
    end

    test "broadcasts new train lists to subscribers", %{server: server} do
      _ = TrainVehiclesPubSub.subscribe("Red", server)

      send(server, {:reset, [@blue_train_vehicle, @red_train_vehicle]})

      assert_receive {:new_train_vehicles, [@red_train_vehicle]}
      refute_receive {:new_train_vehicles, [@blue_train_vehicle]}
    end
  end

  describe "handle_info/2 - {:update, train_vehicles}" do
    setup do
      start_supervised({Registry, keys: :duplicate, name: Realtime.Supervisor.registry_name()})
      subscribe_fn = fn _, _ -> :ok end
      {:ok, server} = TrainVehiclesPubSub.start_link(name: :subscribe, subscribe_fn: subscribe_fn)

      :sys.replace_state(server, fn state ->
        Map.put(
          state,
          :train_vehicles_by_route_id,
          @train_vehicles_by_route_id
        )
      end)

      {:ok, server: server}
    end

    test "updates the given train vehicles in the state", %{
      server: server
    } do
      new_red_train_vehicle = %{@red_train_vehicle | bearing: 20}

      send(server, {:update, [new_red_train_vehicle]})

      expected = %{
        @train_vehicles_by_route_id
        | "Red" => [new_red_train_vehicle]
      }

      assert server |> :sys.get_state() |> Map.get(:train_vehicles_by_route_id) == expected
    end

    test "broadcasts new train lists to subscribers", %{server: server} do
      _ = TrainVehiclesPubSub.subscribe("Red", server)

      send(server, {:reset, [@blue_train_vehicle, @red_train_vehicle]})

      assert_receive {:new_train_vehicles, [@red_train_vehicle]}
      refute_receive {:new_train_vehicles, [@blue_train_vehicle]}
    end
  end

  describe "handle_info/2 - {:add, train_vehicles}" do
    setup do
      start_supervised({Registry, keys: :duplicate, name: Realtime.Supervisor.registry_name()})
      subscribe_fn = fn _, _ -> :ok end
      {:ok, server} = TrainVehiclesPubSub.start_link(name: :subscribe, subscribe_fn: subscribe_fn)

      :sys.replace_state(server, fn state ->
        Map.put(
          state,
          :train_vehicles_by_route_id,
          %{}
        )
      end)

      {:ok, server: server}
    end

    test "adds the new train vehicles by route ID", %{
      server: server
    } do
      send(server, {:add, [@blue_train_vehicle, @red_train_vehicle]})

      assert server |> :sys.get_state() |> Map.get(:train_vehicles_by_route_id) ==
               @train_vehicles_by_route_id
    end

    test "broadcasts new train lists to subscribers", %{server: server} do
      _ = TrainVehiclesPubSub.subscribe("Red", server)

      send(server, {:reset, [@blue_train_vehicle, @red_train_vehicle]})

      assert_receive {:new_train_vehicles, [@red_train_vehicle]}
      refute_receive {:new_train_vehicles, [@blue_train_vehicle]}
    end
  end

  describe "handle_info/2 - {:remove, ids}" do
    setup do
      start_supervised({Registry, keys: :duplicate, name: Realtime.Supervisor.registry_name()})
      subscribe_fn = fn _, _ -> :ok end
      {:ok, server} = TrainVehiclesPubSub.start_link(name: :subscribe, subscribe_fn: subscribe_fn)

      :sys.replace_state(server, fn state ->
        Map.put(
          state,
          :train_vehicles_by_route_id,
          @train_vehicles_by_route_id
        )
      end)

      {:ok, server: server}
    end

    test "removes the given trains from the state", %{
      server: server
    } do
      send(server, {:remove, [@blue_train_vehicle.id]})

      expected = %{
        "Blue" => [],
        "Red" => [@red_train_vehicle]
      }

      assert server |> :sys.get_state() |> Map.get(:train_vehicles_by_route_id) == expected
    end

    test "broadcasts new train lists to subscribers", %{server: server} do
      _ = TrainVehiclesPubSub.subscribe("Blue", server)
      _ = TrainVehiclesPubSub.subscribe("Red", server)

      send(server, {:remove, [@blue_train_vehicle.id]})

      assert_receive {:new_train_vehicles, []}
      assert_receive {:new_train_vehicles, [@red_train_vehicle]}
    end
  end
end
