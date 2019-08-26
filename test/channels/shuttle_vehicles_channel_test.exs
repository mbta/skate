defmodule SkateWeb.ShuttleVehiclesChannelTest do
  use SkateWeb.ChannelCase
  import Test.Support.Helpers

  alias Phoenix.Socket

  alias Realtime.{
    Servers.ShuttleVehicles,
    Vehicle
  }

  alias SkateWeb.{
    AuthManager,
    ShuttleVehiclesChannel,
    UserSocket
  }

  @vehicle %Vehicle{
    id: "",
    run_id: "",
    label: "",
    timestamp: "",
    latitude: 0.0,
    longitude: 0.0,
    direction_id: 0,
    bearing: 0,
    speed: 0,
    stop_sequence: 0,
    block_id: "",
    operator_id: "",
    operator_name: "",
    headway_spacing: :ok,
    is_off_course: false,
    is_laying_over: false,
    block_is_active: true,
    sources: [],
    stop_status: %{},
    route_status: :on_route
  }

  @shuttles %{
    "9990555" => [
      %{@vehicle | id: "shuttle-1", label: "Shuttle 1", run_id: "9990555"},
      %{@vehicle | id: "shuttle-2", label: "Shuttle 2", run_id: "9990555"}
    ],
    "9990000" => [
      %{@vehicle | id: "shuttle-3", label: "Shuttle 3", run_id: "9990000"}
    ]
  }

  setup do
    reassign_env(
      :skate,
      :refresh_token_store,
      FakeRefreshTokenStore
    )

    :ok = ShuttleVehicles.update(@shuttles)
    socket = socket(UserSocket, "", %{})

    {:ok, socket: socket}
  end

  describe "join/3" do
    test "shuttles:all subscribes to all shuttles and returns current list of all shuttles", %{
      socket: socket
    } do
      assert {:ok, all_shuttles, %Socket{}} =
               subscribe_and_join(socket, ShuttleVehiclesChannel, "shuttles:all")

      assert all_shuttles == @shuttles |> Map.values() |> List.flatten()
    end

    test "shuttles:{run_id} subscribes to shuttles for a run ID and returns the current list of shuttles",
         %{
           socket: socket
         } do
      assert {:ok, shuttles, %Socket{}} =
               subscribe_and_join(socket, ShuttleVehiclesChannel, "shuttles:9990555")

      assert shuttles == Map.fetch!(@shuttles, "9990555")
    end

    test "shuttles:run_ids subscribes to run id list and returns the list of current run ids", %{
      socket: socket
    } do
      assert {:ok, run_ids, %Socket{}} =
               subscribe_and_join(socket, ShuttleVehiclesChannel, "shuttles:run_ids")

      assert run_ids == ["9990000", "9990555"]
    end
  end

  describe "handle_info/2" do
    test "sends a message when shuttles are updated", %{socket: socket} do
      {:ok, token, claims} =
        AuthManager.encode_and_sign("test-authed@mbta.com", %{
          "exp" => System.system_time(:second) + 500
        })

      assert {:ok, _, socket} = subscribe_and_join(socket, ShuttleVehiclesChannel, "shuttles:all")

      socket = Guardian.Phoenix.Socket.assign_rtc(socket, "test-authed@mbta.com", token, claims)

      ShuttleVehiclesChannel.handle_info({:new_realtime_data, {:shuttles, [@vehicle]}}, socket)

      assert_push("shuttles", %{data: [@vehicle]})
    end

    test "sends a message when run ids are updated", %{socket: socket} do
      {:ok, token, claims} =
        AuthManager.encode_and_sign("test-authed@mbta.com", %{
          "exp" => System.system_time(:second) + 500
        })

      assert {:ok, _, socket} =
               subscribe_and_join(socket, ShuttleVehiclesChannel, "shuttles:run_ids")

      socket = Guardian.Phoenix.Socket.assign_rtc(socket, "test-authed@mbta.com", token, claims)

      ShuttleVehiclesChannel.handle_info({:new_realtime_data, {:run_ids, ["9990002"]}}, socket)

      assert_push("run_ids", %{data: ["9990002"]})
    end
  end

  test "join/3 returns an error when joining a non-existant topic", %{socket: socket} do
    assert {:error, %{message: "no such topic \"vehicles:1\""}} =
             subscribe_and_join(socket, ShuttleVehiclesChannel, "vehicles:1")
  end

  defmodule FakeRefreshTokenStore do
    def get_refresh_token("test-authed@mbta.com") do
      {:ok, token, _claims} =
        AuthManager.encode_and_sign(
          "test-authed@mbta.com",
          %{
            "exp" => System.system_time(:second) + 500
          },
          token_type: "refresh"
        )

      token
    end
  end
end
