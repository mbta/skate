defmodule SkateWeb.AlertsChannelTest do
  use SkateWeb.ChannelCase
  import Test.Support.Helpers

  alias SkateWeb.{UserSocket, AlertsChannel}

  setup do
    reassign_env(:skate, :valid_token_fn, fn _socket -> true end)

    socket = socket(UserSocket)

    start_supervised({Registry, keys: :duplicate, name: Realtime.Supervisor.registry_name()})
    start_supervised({Realtime.Server, name: Realtime.Server.default_name()})

    {:ok, socket: socket}
  end

  describe "join/3" do
    test "subscribes to alerts for a route and returns the current alerts", %{socket: socket} do
      route_id = "1"

      :ok = Realtime.Server.update_alerts(%{route_id => ["Some alert"]})

      assert {:ok, %{data: ["Some alert"]}, _socket} =
               subscribe_and_join(socket, AlertsChannel, "alerts:route:" <> route_id)
    end

    test "returns an error when trying to join with expired token", %{socket: socket} do
      reassign_env(:skate, :valid_token_fn, fn _socket -> false end)

      for %{result: result, route: route} <- [
            %{result: {:error, :not_authenticated}, route: "alerts:route:"},
            %{result: {:error, :not_authenticated}, route: "vehicles:route:"},
            %{result: {:error, :not_authenticated}, route: "random:topic:1"},
            %{result: {:error, :not_authenticated}, route: "random:topic:2"}
          ],
          do: assert(^result = subscribe_and_join(socket, AlertsChannel, route))
    end
  end

  describe "handle_info/2" do
    setup do
      ets = GenServer.call(Realtime.Server.default_name(), :ets)

      {:ok, ets: ets}
    end

    test "pushes new alert data onto the socket", %{socket: socket, ets: ets} do
      {:ok, _, socket} = subscribe_and_join(socket, AlertsChannel, "alerts:route:1")

      :ok = assert Realtime.Server.update_alerts(%{"1" => ["Some alert"]})

      assert {:noreply, _socket} =
               AlertsChannel.handle_info(
                 {:new_realtime_data, {ets, {:alerts, "1"}}},
                 socket
               )

      assert_push("alerts", %{data: ["Some alert"]})
    end

    test "rejects sending vehicle data when socket is not authenticated", %{
      socket: socket,
      ets: ets
    } do
      {:ok, _, socket} = subscribe_and_join(socket, AlertsChannel, "alerts:route:1")

      reassign_env(:skate, :valid_token_fn, fn _socket -> false end)

      :ok = Realtime.Server.update_alerts(%{"1" => ["Some alert"]})

      assert {:stop, :normal, _socket} =
               AlertsChannel.handle_info(
                 {:new_realtime_data, {ets, {:alerts, "1"}}},
                 socket
               )

      assert_push("auth_expired", _)
    end
  end
end
