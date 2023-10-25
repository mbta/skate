defmodule SkateWeb.VehicleChannelTest do
  use SkateWeb.ChannelCase

  import Test.Support.Helpers
  import Skate.Factory

  alias Phoenix.Socket
  alias Realtime.Vehicle

  alias SkateWeb.{UserSocket, VehicleChannel}

  @vehicle %Vehicle{
    id: "y0507",
    label: "0507",
    timestamp: 123,
    timestamp_by_source: %{"swiftly" => 123},
    latitude: 0.0,
    longitude: 0.0,
    direction_id: "234",
    route_id: "1",
    trip_id: "456",
    bearing: nil,
    block_id: nil,
    operator_id: nil,
    operator_first_name: nil,
    operator_last_name: nil,
    operator_name: nil,
    operator_logon_time: nil,
    overload_offset: 12,
    run_id: "123-4567",
    is_shuttle: false,
    is_overload: false,
    is_off_course: false,
    is_revenue: true,
    layover_departure_time: nil,
    block_is_active: true,
    sources: MapSet.new(["swiftly"]),
    data_discrepancies: [],
    stop_status: %{
      stop_id: "567",
      stop_name: "567"
    },
    timepoint_status: %{
      timepoint_id: "tp2",
      fraction_until_timepoint: 0.4
    },
    route_status: :on_route,
    end_of_trip_type: :another_trip
  }

  setup do
    reassign_env(:skate, :valid_token_fn, fn _socket -> true end)
    reassign_env(:skate, :username_from_socket!, fn _socket -> "test_uid" end)

    user = Skate.Settings.User.upsert("test_uid", "test_email")

    socket =
      UserSocket
      |> socket("", %{})
      |> Guardian.Phoenix.Socket.put_current_resource(%{id: user.id})

    start_supervised({Registry, keys: :duplicate, name: Realtime.Supervisor.registry_name()})
    start_supervised({Realtime.Server, name: Realtime.Server.default_name()})

    {:ok, socket: socket, user: user}
  end

  describe "join/3" do
    test "subscribes to the active vehicle for given run IDs and returns that vehicle", %{
      socket: socket
    } do
      assert Realtime.Server.update_vehicles({%{"1" => [@vehicle]}, [], []}) == :ok
      assert Realtime.Server.peek_at_vehicles_by_run_ids(["123-4567"]) == [@vehicle]

      expected_payload = %{data: @vehicle}

      assert {:ok, ^expected_payload, %Socket{} = _socket} =
               subscribe_and_join(socket, VehicleChannel, "vehicle:run_ids:123-4567")
    end

    test "handles case where vehicle for given run IDs does not exist", %{
      socket: socket
    } do
      assert Realtime.Server.update_vehicles({%{}, [], []}) == :ok

      expected_payload = %{data: nil}

      assert {:ok, ^expected_payload, %Socket{} = _socket} =
               subscribe_and_join(socket, VehicleChannel, "vehicle:run_ids:123-4567")
    end

    test "subscribes to the vehicle for given ID when user is not in the test group", %{
      socket: socket
    } do
      Realtime.Server.update_vehicles({%{"1" => [@vehicle]}, [], []})

      expected_payload = %{data: @vehicle}

      assert {:ok, ^expected_payload, %Socket{} = _socket} =
               subscribe_and_join(socket, VehicleChannel, "vehicle:id:#{@vehicle.id}")
    end

    test "handles case where the vehicle for given ID does not exist", %{
      socket: socket
    } do
      Realtime.Server.update_vehicles({%{}, [], []})

      expected_payload = %{data: nil}

      assert {:ok, ^expected_payload, %Socket{} = _socket} =
               subscribe_and_join(socket, VehicleChannel, "vehicle:id:#{@vehicle.id}")
    end

    test "subscribes to the logged out vehicle for given ID when user is in the test group", %{
      socket: socket,
      user: user
    } do
      test_group = Skate.Settings.TestGroup.create("map-beta")
      Skate.Settings.TestGroup.update(%{test_group | users: [user]})

      logged_out_vehicle = build(:vehicle, id: "y1234", label: "1234", route_id: nil, run_id: nil)

      Realtime.Server.update_vehicles({%{}, [], [logged_out_vehicle]})

      expected_payload = %{data: logged_out_vehicle}

      assert {:ok, ^expected_payload, %Socket{} = _socket} =
               subscribe_and_join(socket, VehicleChannel, "vehicle:id:y1234")
    end

    test "deny topic subscription when socket token validation fails", %{socket: socket} do
      reassign_env(:skate, :valid_token_fn, fn _socket -> false end)

      for route <- [
            "vehicle:run_ids:123-4567",
            "random:topic:"
          ],
          do:
            assert(
              {:error, %{reason: :not_authenticated}} =
                subscribe_and_join(socket, VehicleChannel, route)
            )
    end
  end

  describe "handle_info/2" do
    test "pushes new vehicle data onto the socket", %{
      socket: socket
    } do
      ets = GenServer.call(Realtime.Server.default_name(), :ets)
      assert Realtime.Server.update_vehicles({%{"1" => [@vehicle]}, [], []}) == :ok

      {:ok, _, socket} = subscribe_and_join(socket, VehicleChannel, "vehicle:run_ids:123-4567")

      assert {:noreply, _socket} =
               VehicleChannel.handle_info(
                 {:new_realtime_data, ets},
                 socket
               )

      assert_push("vehicle", %{data: @vehicle})
    end
  end
end
