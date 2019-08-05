defmodule SkateWeb.VehiclesChannelTest do
  use SkateWeb.ChannelCase
  import Test.Support.Helpers

  alias Phoenix.Socket
  alias Realtime.Vehicle
  alias SkateWeb.{AuthManager, UserSocket, VehiclesChannel}

  setup do
    reassign_env(:realtime, :trip_fn, fn _trip_id -> nil end)
    reassign_env(:realtime, :block_fn, fn _block_id, _service_id -> nil end)

    socket = socket(UserSocket, "", %{})

    {:ok, socket: socket}
  end

  describe "join/3" do
    test "subscribes to vehicles for a route ID and returns the current list of vehicles", %{
      socket: socket
    } do
      assert {:ok, %{on_route_vehicles: on_route_vehicles}, %Socket{} = socket} =
               subscribe_and_join(socket, VehiclesChannel, "vehicles:1")

      assert is_list(on_route_vehicles)
      assert Enum.all?(on_route_vehicles, &(%Vehicle{} = &1))
    end

    test "returns an error when joining a non-existant topic", %{socket: socket} do
      assert {:error, %{message: "no such topic \"rooms:1\""}} =
               subscribe_and_join(socket, VehiclesChannel, "rooms:1")
    end
  end

  describe "handle_info/2" do
    test "pushes new vehicle data onto the socket when socket is authenticated", %{socket: socket} do
      new_vehicles = [
        %Vehicle{
          id: "y0507",
          label: "0507",
          timestamp: 123,
          latitude: 0.0,
          longitude: 0.0,
          direction_id: "234",
          route_id: "345",
          trip_id: "456",
          bearing: nil,
          speed: nil,
          stop_sequence: nil,
          block_id: nil,
          operator_id: nil,
          operator_name: nil,
          run_id: nil,
          headway_secs: 600,
          headway_spacing: :ok,
          is_off_course: false,
          block_is_active: true,
          sources: MapSet.new(["swiftly"]),
          data_discrepancies: [],
          stop_status: %{
            status: :in_transit_to,
            stop_id: "567",
            stop_name: "567"
          },
          timepoint_status: %{
            timepoint_id: "tp2",
            fraction_until_timepoint: 0.4
          },
          route_status: :on_route
        }
      ]

      vehicles_for_route = %{
        on_route_vehicles: new_vehicles,
        incoming_vehicles: []
      }

      {:ok, token, claims} =
        AuthManager.encode_and_sign("example@mbta.com", %{
          "exp" => System.system_time(:second) + 500
        })

      {:ok, _, socket} = subscribe_and_join(socket, VehiclesChannel, "vehicles:1")
      socket = Guardian.Phoenix.Socket.assign_rtc(socket, "example@mbta.com", token, claims)

      assert {:noreply, socket} =
               VehiclesChannel.handle_info({:new_realtime_data, vehicles_for_route}, socket)

      assert_push("vehicles", _)
    end

    test "rejects sending vehicle data when socket is not authenticated", %{socket: socket} do
      {:ok, token, claims} =
        AuthManager.encode_and_sign("example@mbta.com", %{
          "exp" => System.system_time(:second) - 100
        })

      {:ok, _, socket} = subscribe_and_join(socket, VehiclesChannel, "vehicles:1")
      socket = Guardian.Phoenix.Socket.assign_rtc(socket, "example@mbta.com", token, claims)

      {:stop, :normal, _socket} = VehiclesChannel.handle_info({:new_realtime_data, %{}}, socket)

      assert_push("auth_expired", _)
    end
  end
end
