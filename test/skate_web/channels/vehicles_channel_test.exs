defmodule SkateWeb.VehiclesChannelTest do
  use SkateWeb.ChannelCase
  import Test.Support.Helpers
  import Skate.Factory
  import ExUnit.CaptureLog, only: [capture_log: 1]

  alias Phoenix.Socket
  alias SkateWeb.{UserSocket, VehiclesChannel}

  @vehicle build(:vehicle)

  setup do
    reassign_env(:skate, :valid_token_fn, fn _socket -> true end)
    reassign_env(:skate, :username_from_socket!, fn _socket -> "test_uid" end)

    socket = socket(UserSocket, "", %{})

    start_supervised({Registry, keys: :duplicate, name: Realtime.Supervisor.registry_name()})
    start_supervised({Realtime.Server, name: Realtime.Server.default_name()})

    {:ok, socket: socket}
  end

  describe "join/3" do
    test "subscribes to vehicles for a route ID and returns the current list of vehicles", %{
      socket: socket
    } do
      assert {:ok, %{data: []}, %Socket{}} =
               subscribe_and_join(socket, VehiclesChannel, "vehicles:route:" <> @vehicle.route_id)
    end

    test "subscribes to all shuttles", %{socket: socket} do
      assert {:ok, %{data: []}, %Socket{}} =
               subscribe_and_join(socket, VehiclesChannel, "vehicles:shuttle:all")
    end

    test "subscribes to vehicles for a run ID", %{socket: socket} do
      assert {:ok, %{data: []}, %Socket{}} =
               subscribe_and_join(socket, VehiclesChannel, "vehicles:run_ids:" <> @vehicle.run_id)
    end

    test "subscribes to vehicles for a block ID", %{socket: socket} do
      assert {:ok, %{data: []}, %Socket{}} =
               subscribe_and_join(
                 socket,
                 VehiclesChannel,
                 "vehicles:block_ids:" <> @vehicle.block_id <> ",some_other_block"
               )
    end

    test "subscribes to a vehicle search", %{socket: socket} do
      assert {:ok, %{data: []}, %Socket{}} =
               subscribe_and_join(
                 socket,
                 VehiclesChannel,
                 "vehicles:search:run:" <> String.slice(@vehicle.run_id, 0, 3)
               )
    end

    test "logs that a user subscribed to a vehicle search", %{socket: socket} do
      old_level = Logger.level()

      on_exit(fn ->
        Logger.configure(level: old_level)
      end)

      Logger.configure(level: :info)

      run_search_term = String.slice(@vehicle.run_id, 0, 3)

      log =
        capture_log(fn ->
          subscribe_and_join(socket, VehiclesChannel, "vehicles:search:run:" <> run_search_term)
        end)

      assert log =~ "User=test_uid searched for property=run, text=" <> run_search_term
    end

    test "returns an error when joining a non-existant topic", %{socket: socket} do
      assert {:error, %{message: "no such topic \"rooms:1\""}} =
               subscribe_and_join(socket, VehiclesChannel, "rooms:1")
    end

    test "returns an error when trying to join with expired token", %{socket: socket} do
      reassign_env(:skate, :valid_token_fn, fn _socket -> false end)
      assert {:error, _} = subscribe_and_join(socket, VehiclesChannel, "vehicles:shuttle:all")
      assert {:error, _} = subscribe_and_join(socket, VehiclesChannel, "vehicles:route:")
      assert {:error, _} = subscribe_and_join(socket, VehiclesChannel, "vehicles:run_ids:")
      assert {:error, _} = subscribe_and_join(socket, VehiclesChannel, "vehicles:block_ids:")
      assert {:error, _} = subscribe_and_join(socket, VehiclesChannel, "vehicles:search:")
      assert {:error, _} = subscribe_and_join(socket, VehiclesChannel, "random:topic:1")
      assert {:error, %{ message: "no such topic" <> _}} = subscribe_and_join(socket, VehiclesChannel, "random:topic:2")
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
      assert Realtime.Server.update_vehicles({%{"1" => [@vehicle]}, []}) == :ok

      {:ok, _, socket} = subscribe_and_join(socket, VehiclesChannel, "vehicles:route:1")

      assert {:noreply, _socket} =
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
      assert Realtime.Server.update_vehicles({%{}, [@vehicle]}) == :ok

      {:ok, _, socket} = subscribe_and_join(socket, VehiclesChannel, "vehicles:shuttle:all")

      assert {:noreply, _socket} =
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
      assert Realtime.Server.update_vehicles({%{}, [@vehicle]}) == :ok

      {:ok, _, socket} =
        subscribe_and_join(socket, VehiclesChannel, "vehicles:search:all:" <> @vehicle.label)

      assert {:noreply, _socket} =
               VehiclesChannel.handle_info(
                 {:new_realtime_data, {ets, {:search, %{text: @vehicle.label, property: :all}}}},
                 socket
               )

      vehicle = @vehicle
      assert_push("search", %{data: [^vehicle]})
    end

    test "rejects sending vehicle data when socket is not authenticated", %{
      socket: socket,
      ets: ets
    } do
      assert Realtime.Server.update_vehicles({%{"1" => [@vehicle]}, []}) == :ok
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
