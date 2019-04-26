defmodule SkateWeb.VehiclesChannelTest do
  use SkateWeb.ChannelCase

  alias Phoenix.Socket
  alias Realtime.Vehicle
  alias SkateWeb.{UserSocket, VehiclesChannel}

  describe "join/3" do
    setup do
      socket = socket(UserSocket, "", %{})

      {:ok, socket: socket}
    end

    test "subscribes to vehicles for a route ID and returns the current list of vehicles", %{
      socket: socket
    } do
      assert {:ok, %{vehicles: vehicles}, %Socket{} = socket} =
               subscribe_and_join(socket, VehiclesChannel, "vehicles:1")

      assert is_list(vehicles)
      assert Enum.all?(vehicles, &(%Vehicle{} = &1))
    end

    test "returns an error when joining a non-existant topic", %{socket: socket} do
      assert {:error, %{message: "no such topic \"rooms:1\""}} =
               subscribe_and_join(socket, VehiclesChannel, "rooms:1")
    end
  end

  describe "handle_info/2" do
    setup do
      {:ok, _, socket} =
        UserSocket
        |> socket("", %{})
        |> subscribe_and_join(VehiclesChannel, "vehicles:1")

      {:ok, socket: socket}
    end

    test "pushes new vehicle data onto the socket", %{socket: socket} do
      new_vehicles = [
        %Vehicle{
          id: "y0507",
          label: "0507",
          timestamp: 123,
          direction_id: "234",
          route_id: "345",
          trip_id: "456",
          current_status: :in_transit_to,
          stop_id: "567",
          status: %{
            stop_granularity: %{
              current_status: :in_transit_to,
              stop_id: "567"
            },
            timepoint_granularity: %{
              current_status: :in_transit_to,
              timepoint_id: "tp2",
              percent_of_the_way: 60
            }
          }
        }
      ]

      assert {:noreply, socket} =
               VehiclesChannel.handle_info({:new_realtime_data, new_vehicles}, socket)

      assert_push("vehicles", new_vehicles)
    end
  end
end
