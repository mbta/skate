defmodule Realtime.Servers.ShuttleVehiclesTest do
  use ExUnit.Case, async: true
  alias Realtime.Servers.ShuttleVehicles, as: Server
  alias Realtime.Vehicle

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
    {:ok, pid} = Server.start_link([])
    Server.update(@shuttles, pid)
    {:ok, pid: pid}
  end

  test "subscribe_to_run_ids", %{pid: pid} do
    assert Server.subscribe_to_run_ids(pid) == ["9990000", "9990555"]

    assert :ok =
             @shuttles
             |> Map.put("9990001", [@vehicle])
             |> Server.update(pid)

    assert_receive {:new_realtime_data, {:run_ids, ["9990000", "9990001", "9990555"]}},
                   2000
  end

  test "subscribe_to_all_shuttles", %{pid: pid} do
    assert [%Vehicle{}, %Vehicle{}, %Vehicle{}] = Server.subscribe_to_all_shuttles(pid)

    assert :ok =
             @shuttles
             |> Map.put("9990001", [@vehicle])
             |> Server.update(pid)

    assert_receive {:new_realtime_data,
                    {:shuttles, [%Vehicle{}, %Vehicle{}, %Vehicle{}, %Vehicle{}]}}
  end

  test "subscribe_to_run", %{pid: pid} do
    assert [%Vehicle{}] = Server.subscribe_to_run("9990000", pid)

    assert :ok =
             @shuttles
             |> Map.put("9990000", [@vehicle, @vehicle])
             |> Server.update(pid)

    assert_receive {:new_realtime_data, {:shuttles, [%Vehicle{}, %Vehicle{}]}}
  end
end
