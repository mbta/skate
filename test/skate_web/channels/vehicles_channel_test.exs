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

    user = Skate.Settings.User.upsert("test_uid", "test_email")

    socket =
      UserSocket
      |> socket("", %{})
      |> Guardian.Phoenix.Socket.put_current_resource(%{id: user.id})

    start_supervised({Phoenix.PubSub, name: Realtime.Server.pubsub_name()})
    start_supervised({Realtime.Server, name: Realtime.Server.default_name()})

    {:ok, socket: socket, user: user}
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

    test "subscribes to all pull-backs", %{socket: socket} do
      assert {:ok, %{data: []}, %Socket{}} =
               subscribe_and_join(socket, VehiclesChannel, "vehicles:pull_backs:all")
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

    test "deny topic subscription when socket token validation fails", %{socket: socket} do
      reassign_env(:skate, :valid_token_fn, fn _socket -> false end)

      for route <- [
            "vehicles:shuttle:all",
            "vehicles:route:",
            "vehicles:run_ids:",
            "vehicles:block_ids:",
            "vehicles:search:",
            "random:topic:"
          ],
          do:
            assert(
              {:error, %{reason: :not_authenticated}} =
                subscribe_and_join(socket, VehiclesChannel, route)
            )
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
      assert Realtime.Server.update_vehicles({%{"1" => [@vehicle]}, [], []}) == :ok

      {:ok, _, socket} = subscribe_and_join(socket, VehiclesChannel, "vehicles:route:1")

      assert {:noreply, _socket} =
               VehiclesChannel.handle_info(
                 {:new_realtime_data, ets},
                 socket
               )

      vehicle = @vehicle
      assert_push("vehicles", %{data: [^vehicle]})
    end

    test "pushes new shuttle data onto the socket", %{
      socket: socket,
      ets: ets
    } do
      assert Realtime.Server.update_vehicles({%{}, [@vehicle], []}) == :ok

      {:ok, _, socket} = subscribe_and_join(socket, VehiclesChannel, "vehicles:shuttle:all")

      assert {:noreply, _socket} =
               VehiclesChannel.handle_info(
                 {:new_realtime_data, ets},
                 socket
               )

      vehicle = @vehicle
      assert_push("shuttles", %{data: [^vehicle]})
    end

    test "pushes new pull-back data onto the socket", %{
      socket: socket,
      ets: ets
    } do
      pull_back_vehicle = build(:vehicle, %{route_id: "1", end_of_trip_type: :pull_back})

      assert Realtime.Server.update_vehicles({%{"1" => [pull_back_vehicle]}, [], []}) == :ok

      {:ok, _, socket} = subscribe_and_join(socket, VehiclesChannel, "vehicles:pull_backs:all")

      assert {:noreply, _socket} =
               VehiclesChannel.handle_info(
                 {:new_realtime_data, ets},
                 socket
               )

      assert_push("pull_backs", %{data: [^pull_back_vehicle]})
    end

    test "pushes new search results data onto the socket", %{
      socket: socket,
      ets: ets
    } do
      assert Realtime.Server.update_vehicles({%{}, [@vehicle], []}) == :ok

      {:ok, _, socket} =
        subscribe_and_join(socket, VehiclesChannel, "vehicles:search:all:" <> @vehicle.label)

      assert {:noreply, _socket} =
               VehiclesChannel.handle_info(
                 {:new_realtime_data, ets},
                 socket
               )

      vehicle = @vehicle
      assert_push("search", %{data: [^vehicle]})
    end

    test "when user is in test group to enable searching logged out vehicles, then logged out vehicles are included in their search results",
         %{
           socket: socket,
           user: user
         } do
      test_group = Skate.Settings.TestGroup.create("map-beta")
      Skate.Settings.TestGroup.update(%{test_group | users: [user]})

      logged_in_vehicle =
        build(:vehicle, id: "y1235", label: "1235", route_id: "1", run_id: "run_id")

      logged_out_vehicle = build(:vehicle, id: "y1234", label: "1234", route_id: nil, run_id: nil)

      {:ok, _reply, _socket} =
        subscribe_and_join(socket, VehiclesChannel, "vehicles:search:all:123")

      Realtime.Server.update_vehicles({%{"1" => [logged_in_vehicle]}, [], [logged_out_vehicle]})

      assert_push("search", %{data: [^logged_in_vehicle, ^logged_out_vehicle]})
    end

    test "when user is not in a test group to enable searching logged out vehicles, then logged out vehicles are included in their search results",
         %{
           socket: socket
         } do
      logged_in_vehicle =
        build(:vehicle, id: "y1235", label: "1235", route_id: "1", run_id: "run_id")

      logged_out_vehicle = build(:vehicle, id: "y1234", label: "1234", route_id: nil, run_id: nil)

      {:ok, _reply, _socket} =
        subscribe_and_join(socket, VehiclesChannel, "vehicles:search:all:123")

      Realtime.Server.update_vehicles({%{"1" => [logged_in_vehicle]}, [], [logged_out_vehicle]})

      assert_push("search", %{data: [^logged_in_vehicle]})
    end

    test "rejects sending vehicle data when socket is not authenticated", %{
      socket: socket,
      ets: ets
    } do
      assert Realtime.Server.update_vehicles({%{"1" => [@vehicle]}, [], []}) == :ok
      {:ok, _, socket} = subscribe_and_join(socket, VehiclesChannel, "vehicles:route:1")

      reassign_env(:skate, :valid_token_fn, fn _socket -> false end)

      {:stop, :normal, _socket} =
        VehiclesChannel.handle_info(
          {:new_realtime_data, ets},
          socket
        )

      assert_push("auth_expired", _)
    end
  end
end
