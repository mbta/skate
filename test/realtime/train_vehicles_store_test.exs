defmodule Realtime.TrainVehiclesStoreTest do
  use ExUnit.Case, async: true

  alias Realtime.TrainVehiclesStore
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
  @green_b_train_vehicle %TrainVehicle{
    id: "green1",
    route_id: "Green-B",
    latitude: 42.24615,
    longitude: -71.00369,
    bearing: 15
  }
  @train_vehicles_by_route_id %{
    "Blue" => [@blue_train_vehicle],
    "Red" => [@red_train_vehicle],
    "Green" => [@green_b_train_vehicle]
  }

  describe "reset/2" do
    test "resets to the given vehicles" do
      initial = %TrainVehiclesStore{}
      new_vehicles = [@blue_train_vehicle, @red_train_vehicle, @green_b_train_vehicle]

      assert TrainVehiclesStore.reset(initial, new_vehicles).train_vehicles_by_route_id ==
               @train_vehicles_by_route_id
    end
  end

  describe "add/2" do
    test "adds the given vehicles to the store" do
      initial = %TrainVehiclesStore{}
      new_vehicles = [@blue_train_vehicle, @red_train_vehicle, @green_b_train_vehicle]

      assert TrainVehiclesStore.add(initial, new_vehicles).train_vehicles_by_route_id ==
               @train_vehicles_by_route_id
    end
  end

  describe "update/2" do
    test "updates the given vehicles in the store" do
      initial = %TrainVehiclesStore{train_vehicles_by_route_id: @train_vehicles_by_route_id}
      new_green_b_train_vehicle = %{@green_b_train_vehicle | bearing: 20}

      expected = %{
        @train_vehicles_by_route_id
        | "Green" => [new_green_b_train_vehicle]
      }

      assert TrainVehiclesStore.update(initial, [new_green_b_train_vehicle]).train_vehicles_by_route_id ==
               expected
    end
  end

  describe "remove/2" do
    test "removes the given vehicles from the store" do
      initial = %TrainVehiclesStore{train_vehicles_by_route_id: @train_vehicles_by_route_id}
      ids_to_remove = [@blue_train_vehicle.id]

      expected = %{
        "Blue" => [],
        "Red" => [@red_train_vehicle],
        "Green" => [@green_b_train_vehicle]
      }

      assert TrainVehiclesStore.remove(initial, ids_to_remove).train_vehicles_by_route_id ==
               expected
    end
  end
end
