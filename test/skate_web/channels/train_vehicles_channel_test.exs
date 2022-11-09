defmodule SkateWeb.TrainVehiclesChannelTest do
  use SkateWeb.ChannelCase
  import Test.Support.Helpers

  alias Phoenix.Socket
  alias SkateWeb.{TrainVehiclesChannel, UserSocket}
  alias TrainVehicles.TrainVehicle

  @red_train_vehicles [
    %TrainVehicle{
      id: "red1",
      route_id: "Red",
      latitude: 42.24615,
      longitude: -71.00369,
      bearing: 15
    }
  ]

  setup do
    reassign_env(:skate, :valid_token?, fn _socket -> true end)

    reassign_env(:skate_web, :train_vehicles_subscribe_fn, fn route_id ->
      case route_id do
        "Red" ->
          @red_train_vehicles

        _ ->
          []
      end
    end)

    socket = socket(UserSocket, "", %{})

    {:ok, socket: socket}
  end

  describe "join/3" do
    test "subscribes to trains for a route ID and returns the current list of train vehicles", %{
      socket: socket
    } do
      assert {:ok, %{data: red_line_trains}, %Socket{}} =
               subscribe_and_join(socket, TrainVehiclesChannel, "train_vehicles:Red")

      assert red_line_trains == @red_train_vehicles
    end
  end

  describe "handle_info/2" do
    test "pushes new data onto the socket", %{socket: socket} do
      {:ok, _, socket} = subscribe_and_join(socket, TrainVehiclesChannel, "train_vehicles:Red")

      assert {:noreply, _socket} =
               TrainVehiclesChannel.handle_info(
                 {:new_train_vehicles, @red_train_vehicles},
                 socket
               )

      assert_push("train_vehicles", %{data: @red_train_vehicles})
    end

    test "rejects sending vehicle data when socket is not authenticated", %{socket: socket} do
      reassign_env(:skate, :valid_token?, fn _socket -> false end)

      {:ok, _, socket} = subscribe_and_join(socket, TrainVehiclesChannel, "train_vehicles:Red")

      assert {:stop, :normal, _socket} =
               TrainVehiclesChannel.handle_info(
                 {:new_train_vehicles, @red_train_vehicles},
                 socket
               )

      assert_push("auth_expired", _)
    end
  end
end
