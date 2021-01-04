defmodule SkateWeb.VehicleChannelTest do
  use SkateWeb.ChannelCase

  import Test.Support.Helpers

  alias Phoenix.Socket
  alias Realtime.Vehicle

  alias SkateWeb.{UserSocket, VehicleChannel}

  @vehicle %Vehicle{
    id: "y0507",
    label: "0507",
    timestamp: 123,
    latitude: 0.0,
    longitude: 0.0,
    direction_id: "234",
    route_id: "1",
    trip_id: "456",
    bearing: nil,
    block_id: nil,
    operator_id: nil,
    operator_name: nil,
    operator_logon_time: nil,
    run_id: "123-4567",
    headway_secs: 600,
    headway_spacing: :ok,
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

    socket = socket(UserSocket, "", %{guardian_default_resource: "test_uid"})

    start_supervised({Registry, keys: :duplicate, name: Realtime.Supervisor.registry_name()})
    start_supervised({Realtime.Server, name: Realtime.Server.default_name()})

    {:ok, socket: socket}
  end

  describe "join/3" do
    test "subscribes to the active vehicle for given run IDs and returns that vehicle", %{
      socket: socket
    } do
      assert Realtime.Server.update({%{"1" => [@vehicle]}, []}) == :ok
      assert Realtime.Server.peek_at_vehicles(["123-4567"]) == [@vehicle]

      expected_payload = %{data: @vehicle}

      assert {:ok, ^expected_payload, %Socket{} = socket} =
               subscribe_and_join(socket, VehicleChannel, "vehicle:run_ids:123-4567")
    end
  end

  describe "handle_info/2" do
    test "pushes new vehicle data onto the socket", %{
      socket: socket
    } do
      ets = GenServer.call(Realtime.Server.default_name(), :ets)
      assert Realtime.Server.update({%{"1" => [@vehicle]}, []}) == :ok

      {:ok, _, socket} = subscribe_and_join(socket, VehicleChannel, "vehicle:run_ids:123-4567")

      assert {:noreply, socket} =
               VehicleChannel.handle_info(
                 {:new_realtime_data, {ets, {:route_id, "1"}}},
                 socket
               )

      assert_push("vehicle", %{data: @vehicle})
    end
  end
end
