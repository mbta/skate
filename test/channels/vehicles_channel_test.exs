defmodule SkateWeb.VehiclesChannelTest do
  use SkateWeb.ChannelCase
  import Test.Support.Helpers

  alias Phoenix.Socket
  alias Realtime.Vehicle
  alias SkateWeb.{AuthManager, UserSocket, VehiclesChannel}

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
    run_id: "123-4567",
    headway_secs: 600,
    headway_spacing: :ok,
    is_off_course: false,
    is_laying_over: false,
    layover_departure_time: nil,
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

  setup do
    reassign_env(:realtime, :trip_fn, fn _trip_id -> nil end)
    reassign_env(:realtime, :block_fn, fn _block_id, _service_id -> nil end)

    socket = socket(UserSocket, "", %{})

    start_supervised({Registry, keys: :duplicate, name: Realtime.Server.registry_name()})
    start_supervised({Realtime.Server, name: Realtime.Server.default_name()})

    {:ok, socket: socket}
  end

  describe "join/3" do
    test "subscribes to vehicles for a route ID and returns the current list of vehicles", %{
      socket: socket
    } do
      assert {:ok, %{on_route_vehicles: on_route_vehicles}, %Socket{} = socket} =
               subscribe_and_join(socket, VehiclesChannel, "vehicles:route:1")

      assert is_list(on_route_vehicles)
      assert Enum.all?(on_route_vehicles, &(%Vehicle{} = &1))
    end

    test "subscribes to all shuttles", %{socket: socket} do
      assert {:ok, %{data: []}, %Socket{}} =
               subscribe_and_join(socket, VehiclesChannel, "vehicles:shuttle:all")
    end

    test "subscribes to a vehicle search", %{socket: socket} do
      assert {:ok, %{data: []}, %Socket{}} =
               subscribe_and_join(socket, VehiclesChannel, "vehicles:search:run:123")
    end

    test "returns an error when joining a non-existant topic", %{socket: socket} do
      assert {:error, %{message: "no such topic \"rooms:1\""}} =
               subscribe_and_join(socket, VehiclesChannel, "rooms:1")
    end
  end

  describe "handle_info/2" do
    setup do
      reassign_env(
        :skate,
        :refresh_token_store,
        SkateWeb.VehiclesChannelTest.FakeRefreshTokenStore
      )

      vehicles_for_route = %{
        on_route_vehicles: [@vehicle],
        incoming_vehicles: []
      }

      ets = GenServer.call(Realtime.Server.default_name(), :ets)

      {:ok, vehicles_for_route: vehicles_for_route, ets: ets}
    end

    test "pushes new vehicle data onto the socket when socket is authenticated", %{
      socket: socket,
      vehicles_for_route: vehicles_for_route,
      ets: ets
    } do
      assert Realtime.Server.update({%{"1" => vehicles_for_route}, []}) == :ok

      {:ok, token, claims} =
        AuthManager.encode_and_sign("test-authed@mbta.com", %{
          "exp" => System.system_time(:second) + 500
        })

      {:ok, _, socket} = subscribe_and_join(socket, VehiclesChannel, "vehicles:route:1")
      socket = Guardian.Phoenix.Socket.assign_rtc(socket, "test-authed@mbta.com", token, claims)

      assert {:noreply, socket} =
               VehiclesChannel.handle_info(
                 {:new_realtime_data, {ets, {:route_id, "1"}}},
                 socket
               )

      assert_push("vehicles", ^vehicles_for_route)
    end

    test "pushes new shuttle data onto the socket when socket is authenticated", %{
      socket: socket,
      vehicles_for_route: %{on_route_vehicles: [vehicle]},
      ets: ets
    } do
      assert Realtime.Server.update({%{}, [vehicle]}) == :ok

      {:ok, token, claims} =
        AuthManager.encode_and_sign("test-authed@mbta.com", %{
          "exp" => System.system_time(:second) + 500
        })

      {:ok, _, socket} = subscribe_and_join(socket, VehiclesChannel, "vehicles:shuttle:all")
      socket = Guardian.Phoenix.Socket.assign_rtc(socket, "test-authed@mbta.com", token, claims)

      assert {:noreply, socket} =
               VehiclesChannel.handle_info(
                 {:new_realtime_data, {ets, :all_shuttles}},
                 socket
               )

      assert_push("shuttles", %{data: [vehicle]})
    end

    test "pushes new search results data onto the socket when socket is authenticated", %{
      socket: socket,
      ets: ets
    } do
      assert Realtime.Server.update({%{}, [@vehicle]}) == :ok

      {:ok, token, claims} =
        AuthManager.encode_and_sign("test-authed@mbta.com", %{
          "exp" => System.system_time(:second) + 500
        })

      {:ok, _, socket} = subscribe_and_join(socket, VehiclesChannel, "vehicles:search:all:1")
      socket = Guardian.Phoenix.Socket.assign_rtc(socket, "test-authed@mbta.com", token, claims)

      assert {:noreply, socket} =
               VehiclesChannel.handle_info(
                 {:new_realtime_data, {ets, {:search, %{text: "1", property: :all}}}},
                 socket
               )

      assert_push("search", %{data: [vehicle]})
    end

    test "refresh the authentication using the refresh token if we have one", %{
      socket: socket,
      vehicles_for_route: vehicles_for_route,
      ets: ets
    } do
      assert Realtime.Server.update({%{"1" => vehicles_for_route}, []})

      {:ok, token, claims} =
        AuthManager.encode_and_sign("test-expired@mbta.com", %{
          "exp" => System.system_time(:second) - 100
        })

      {:ok, _, socket} = subscribe_and_join(socket, VehiclesChannel, "vehicles:route:1")

      socket = Guardian.Phoenix.Socket.assign_rtc(socket, "test-expired@mbta.com", token, claims)

      assert {:noreply, socket} =
               VehiclesChannel.handle_info(
                 {:new_realtime_data, {ets, {:route_id, "1"}}},
                 socket
               )

      assert_push("vehicles", ^vehicles_for_route)
    end

    test "rejects sending vehicle data when socket is not authenticated", %{
      socket: socket,
      ets: ets
    } do
      {:ok, token, claims} =
        AuthManager.encode_and_sign("test-not-authed@mbta.com", %{
          "exp" => System.system_time(:second) - 100
        })

      {:ok, _, socket} = subscribe_and_join(socket, VehiclesChannel, "vehicles:route:1")

      socket =
        Guardian.Phoenix.Socket.assign_rtc(socket, "test-not-authed@mbta.com", token, claims)

      {:stop, :normal, _socket} =
        VehiclesChannel.handle_info(
          {:new_realtime_data, {ets, {:route_id, "1"}}},
          socket
        )

      assert_push("auth_expired", _)
    end
  end

  defmodule FakeRefreshTokenStore do
    def get_refresh_token("test-expired@mbta.com") do
      {:ok, token, _claims} =
        AuthManager.encode_and_sign(
          "test-expired@mbta.com",
          %{
            "exp" => System.system_time(:second) + 500
          },
          token_type: "refresh"
        )

      token
    end

    def get_refresh_token(_), do: nil
  end
end
