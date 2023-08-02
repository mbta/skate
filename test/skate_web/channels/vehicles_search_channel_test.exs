defmodule SkateWeb.VehiclesSearchChannelTest do
  use SkateWeb.ChannelCase

  import Test.Support.Helpers
  import Skate.Factory

  alias Phoenix.Socket

  alias SkateWeb.{UserSocket, VehiclesSearchChannel}

  setup do
    reassign_env(:skate, :valid_token_fn, fn _socket -> true end)
    reassign_env(:skate, :username_from_socket!, fn _socket -> "test_uid" end)
    reassign_env(:skate, :vehicle_search_default_limit, 2)

    user = Skate.Settings.User.upsert("test_uid", "test_email")

    socket =
      UserSocket
      |> socket("", %{})
      |> Guardian.Phoenix.Socket.put_current_resource(%{id: user.id})

    start_supervised({Registry, keys: :duplicate, name: Realtime.Supervisor.registry_name()})
    start_supervised({Realtime.Server, name: Realtime.Server.default_name()})

    {:ok,
     socket: socket,
     user: user,
     vehicles: [
       build(:vehicle, %{id: "1", label: "0001", route_id: "1", operator_logon_time: 300}),
       build(:vehicle, %{id: "2", label: "not_match_2", route_id: "1"}),
       build(:vehicle, %{id: "3", label: "0002", route_id: "1", operator_logon_time: 200}),
       build(:vehicle, %{id: "4", label: "not_match_3", route_id: "1"}),
       build(:vehicle, %{id: "5", label: "0003", route_id: "1", operator_logon_time: 100})
     ]}
  end

  describe "join/3" do
    test "returns current data matching search", %{
      socket: socket,
      vehicles: vehicles
    } do
      [match_1, _other, match_2, _other_2, _match_3] = vehicles
      assert :ok = Realtime.Server.update_vehicles({%{"1" => vehicles}, [], []})
      expected_payload = %{data: %{matching_vehicles: [match_1, match_2], has_more_matches: true}}

      assert {:ok, ^expected_payload, %Socket{} = _socket} =
               subscribe_and_join(
                 socket,
                 VehiclesSearchChannel,
                 "vehicles_search:limited:vehicle:000"
               )
    end

    test "subscribes to vehicle updates", %{
      socket: socket,
      vehicles: vehicles
    } do
      [match_1, _other, match_2, _other_2, _match_3] = vehicles
      assert :ok = Realtime.Server.update_vehicles({%{"1" => []}, [], []})

      assert {:ok, %{data: %{matching_vehicles: [], has_more_matches: false}},
              %Socket{} = _socket} =
               subscribe_and_join(
                 socket,
                 VehiclesSearchChannel,
                 "vehicles_search:limited:vehicle:000"
               )

      assert :ok = Realtime.Server.update_vehicles({%{"1" => vehicles}, [], []})

      assert_push("limited_search", %{
        data: %{matching_vehicles: [^match_1, ^match_2], has_more_matches: true}
      })
    end
  end

  describe "handle_info/2" do
    test "pushes new vehicle data onto the socket", %{
      socket: socket,
      vehicles: vehicles
    } do
      [match_1, _other, match_2, _other_2, _match_3] = vehicles
      ets = GenServer.call(Realtime.Server.default_name(), :ets)
      assert :ok = Realtime.Server.update_vehicles({%{"1" => vehicles}, [], []})

      {:ok, _data, socket} =
        subscribe_and_join(
          socket,
          VehiclesSearchChannel,
          "vehicles_search:limited:vehicle:000"
        )

      assert {:noreply, _socket} =
               VehiclesSearchChannel.handle_info(
                 {:new_realtime_data,
                  {ets, {:limited_search, %{property: :vehicle, text: "000", limit: 2}}}},
                 socket
               )

      assert_push("limited_search", %{
        data: %{matching_vehicles: [^match_1, ^match_2], has_more_matches: true}
      })
    end
  end

  describe "handle_in/3" do
    test "updates subscription and returns data for updated search query", %{
      socket: socket,
      vehicles: vehicles
    } do
      [match_1, _other, match_2, _other_2, match_3] = vehicles

      new_match =
        build(:vehicle, %{id: "6", label: "0004", route_id: "1", operator_logon_time: 400})

      assert :ok = Realtime.Server.update_vehicles({%{"1" => vehicles}, [], []})

      {:ok, %{data: %{matching_vehicles: [^match_1, ^match_2], has_more_matches: true}}, socket} =
        subscribe_and_join(
          socket,
          VehiclesSearchChannel,
          "vehicles_search:limited:vehicle:000"
        )

      ref =
        Phoenix.ChannelTest.push(socket, "update_search_query", %{
          "limit" => 3
        })

      assert_reply ref, :ok, %{
        data: %{matching_vehicles: [^match_1, ^match_2, ^match_3], has_more_matches: false}
      }

      assert :ok =
               Realtime.Server.update_vehicles({%{"1" => [new_match, match_1, match_2]}, [], []})

      assert_push("limited_search", %{
        data: %{matching_vehicles: [^new_match, ^match_1, ^match_2], has_more_matches: false}
      })
    end
  end
end
