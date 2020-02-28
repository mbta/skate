defmodule SkateWeb.VehiclesChannelTest do
  use SkateWeb.ChannelCase
  import Test.Support.Helpers
  import ExUnit.CaptureLog, only: [capture_log: 1]

  alias Phoenix.Socket
  alias Realtime.Vehicle
  alias SkateWeb.{UserSocket, VehiclesChannel}

  @vehicle %Vehicle{
    id: "y0507",
    label: "0507",
    timestamp: 123,
    latitude: 0.0,
    longitude: 0.0,
    direction_id: "234",
    route_id: "345",
    trip_id: "456",
    bearing: nil,
    block_id: nil,
    operator_id: nil,
    operator_name: nil,
    operator_logon_time: nil,
    run_id: "123-4567",
    headway_secs: 600,
    headway_spacing: :ok,
    is_off_course: false,
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
    test "subscribes to vehicles for a route ID and returns the current list of vehicles", %{
      socket: socket
    } do
      assert {:ok, %{data: []}, %Socket{} = socket} =
               subscribe_and_join(socket, VehiclesChannel, "vehicles:route:1")
    end

    test "subscribes to all shuttles", %{socket: socket} do
      assert {:ok, %{data: []}, %Socket{}} =
               subscribe_and_join(socket, VehiclesChannel, "vehicles:shuttle:all")
    end

    test "subscribes to a vehicle search", %{socket: socket} do
      assert {:ok, %{data: []}, %Socket{}} =
               subscribe_and_join(socket, VehiclesChannel, "vehicles:search:run:123")
    end

    test "logs that a user subscribed to a vehicle search", %{socket: socket} do
      old_level = Logger.level()

      on_exit(fn ->
        Logger.configure(level: old_level)
      end)

      Logger.configure(level: :info)

      log =
        capture_log(fn ->
          subscribe_and_join(socket, VehiclesChannel, "vehicles:search:run:123")
        end)

      assert log =~ "User=test_uid searched for property=run, text=123"
    end

    test "returns an error when joining a non-existant topic", %{socket: socket} do
      assert {:error, %{message: "no such topic \"rooms:1\""}} =
               subscribe_and_join(socket, VehiclesChannel, "rooms:1")
    end
  end

  describe "handle_info/2" do
    setup do
      ets = GenServer.call(Realtime.Server.default_name(), :ets)

      {:ok, ets: ets}
    end

    test "pushes new vehicle data onto the socket", %{
      socket: socket,
      ets: ets
    } do
      assert Realtime.Server.update({:vehicle_positions, %{"1" => [@vehicle]}, []}) == :ok

      {:ok, _, socket} = subscribe_and_join(socket, VehiclesChannel, "vehicles:route:1")

      assert {:noreply, socket} =
               VehiclesChannel.handle_info(
                 {:new_realtime_data, {ets, {:route_id, "1"}}},
                 socket
               )

      vehicle = @vehicle
      assert_push("vehicles", %{data: [^vehicle]})
    end

    test "pushes new shuttle data onto the socket", %{
      socket: socket,
      ets: ets
    } do
      assert Realtime.Server.update({:vehicle_positions, %{}, [@vehicle]}) == :ok

      {:ok, _, socket} = subscribe_and_join(socket, VehiclesChannel, "vehicles:shuttle:all")

      assert {:noreply, socket} =
               VehiclesChannel.handle_info(
                 {:new_realtime_data, {ets, :all_shuttles}},
                 socket
               )

      vehicle = @vehicle
      assert_push("shuttles", %{data: [^vehicle]})
    end

    test "pushes new search results data onto the socket", %{
      socket: socket,
      ets: ets
    } do
      assert Realtime.Server.update({:vehicle_positions, %{}, [@vehicle]}) == :ok

      {:ok, _, socket} = subscribe_and_join(socket, VehiclesChannel, "vehicles:search:all:507")

      assert {:noreply, socket} =
               VehiclesChannel.handle_info(
                 {:new_realtime_data, {ets, {:search, %{text: "507", property: :all}}}},
                 socket
               )

      vehicle = @vehicle
      assert_push("search", %{data: [^vehicle]})
    end

    test "rejects sending vehicle data when socket is not authenticated", %{
      socket: socket,
      ets: ets
    } do
      assert Realtime.Server.update({:vehicle_positions, %{"1" => [@vehicle]}, []}) == :ok
      reassign_env(:skate, :valid_token_fn, fn _socket -> false end)

      {:ok, _, socket} = subscribe_and_join(socket, VehiclesChannel, "vehicles:route:1")

      {:stop, :normal, _socket} =
        VehiclesChannel.handle_info(
          {:new_realtime_data, {ets, {:route_id, "1"}}},
          socket
        )

      assert_push("auth_expired", _)
    end
  end
end
