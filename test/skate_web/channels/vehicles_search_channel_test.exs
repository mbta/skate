defmodule SkateWeb.VehiclesSearchChannelTest do
  use SkateWeb.ChannelCase

  import Test.Support.Helpers
  import Skate.Factory

  alias Phoenix.Socket

  alias SkateWeb.{UserSocket, VehiclesSearchChannel}

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

    {:ok,
     socket: socket,
     user: user,
     vehicles: [
       build(:vehicle, %{id: "1", label: "0001", route_id: "1"}),
       build(:vehicle, %{id: "2", label: "not_match_2", route_id: "1"}),
       build(:vehicle, %{id: "3", label: "0002", route_id: "1"}),
       build(:vehicle, %{id: "4", label: "not_match_3", route_id: "1"}),
       build(:vehicle, %{id: "5", label: "0003", route_id: "1"})
     ]}
  end

  describe "join/3" do
    test "returns current data matching search", %{
      socket: socket,
      vehicles: vehicles
    } do
      [match_1, _other, match_2, _other_2, _match_3] = vehicles
      assert :ok = Realtime.Server.update_vehicles({%{"1" => vehicles}, [], []})
      expected_payload = %{data: [match_1, match_2]}

      assert {:ok, ^expected_payload, %Socket{} = _socket} =
               subscribe_and_join(socket, VehiclesSearchChannel, "vehicles_search:", %{
                 "property" => "vehicle",
                 "text" => "000",
                 "limit" => 2
               })
    end

    test "subscribes to vehicle updates", %{
      socket: socket,
      vehicles: vehicles
    } do
      [match_1, _other, match_2, _other_2, _match_3] = vehicles
      assert :ok = Realtime.Server.update_vehicles({%{"1" => []}, [], []})

      assert {:ok, %{data: []}, %Socket{} = _socket} =
               subscribe_and_join(socket, VehiclesSearchChannel, "vehicles_search:", %{
                 "property" => "vehicle",
                 "text" => "000",
                 "limit" => 2
               })

      assert :ok = Realtime.Server.update_vehicles({%{"1" => vehicles}, [], []})

      assert_push("search", %{data: [^match_1, ^match_2]})
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
        subscribe_and_join(socket, VehiclesSearchChannel, "vehicles_search:", %{
          "property" => "vehicle",
          "text" => "000",
          "limit" => 2
        })

      assert {:noreply, _socket} =
               VehiclesSearchChannel.handle_info(
                 {:new_realtime_data,
                  {ets, {:search, %{property: :vehicle, text: "000", limit: 2}}}},
                 socket
               )

      assert_push("search", %{data: [^match_1, ^match_2]})
    end
  end

  describe "handle_in/3" do
    test "updates subscription and returns data for updated search query", %{
      socket: socket,
      vehicles: vehicles
    } do
      [match_1, _other, match_2, _other_2, match_3] = vehicles
      new_match = build(:vehicle, %{id: "6", label: "0004", route_id: "1"})

      assert :ok = Realtime.Server.update_vehicles({%{"1" => vehicles}, [], []})

      {:ok, %{data: [^match_1, ^match_2]}, socket} =
        subscribe_and_join(socket, VehiclesSearchChannel, "vehicles_search:", %{
          "property" => "vehicle",
          "text" => "000",
          "limit" => 2
        })

      ref =
        Phoenix.ChannelTest.push(socket, "update_search_query", %{
          "property" => "vehicle",
          "text" => "000",
          "limit" => 3
        })

      assert_reply ref, :ok, %{data: [^match_1, ^match_2, ^match_3]}

      assert :ok =
               Realtime.Server.update_vehicles({%{"1" => [new_match, match_1, match_2]}, [], []})

      assert_push("search", %{data: [^new_match, ^match_1, ^match_2]})
    end
  end
end
