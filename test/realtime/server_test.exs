defmodule Realtime.ServerTest do
  use ExUnit.Case, async: true
  import Test.Support.Helpers

  alias Realtime.{Server, Vehicle}

  @vehicle %Vehicle{
    id: "v1",
    label: "v1-label",
    timestamp: 1_558_121_727,
    latitude: 42.3408556,
    longitude: -71.0642766,
    direction_id: 0,
    route_id: "1",
    trip_id: "t1",
    bearing: nil,
    speed: nil,
    stop_sequence: 1,
    block_id: "A505-106",
    operator_id: "71041",
    operator_name: "FRANK",
    run_id: "123-9048",
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
      stop_id: "s1"
    },
    timepoint_status: %{
      timepoint_id: "tp1",
      fraction_until_timepoint: 0.2
    },
    route_status: :on_route
  }

  @shuttle %{@vehicle | id: "shuttle", run_id: "9990555", route_id: nil}

  @vehicles_for_route %{
    on_route_vehicles: [@vehicle],
    incoming_vehicles: []
  }

  @vehicles_by_route_id %{
    "1" => @vehicles_for_route
  }

  describe "subscribe_to_route" do
    setup do
      reassign_env(:realtime, :trip_fn, fn _trip_id -> nil end)
      reassign_env(:realtime, :block_fn, fn _block_id, _service_id -> nil end)

      {:ok, server_pid} = Server.start_link([])

      Server.update_vehicles_by_route_id(@vehicles_by_route_id, server_pid)

      %{server_pid: server_pid}
    end

    test "clients get vehicles when subscribing", %{server_pid: server_pid} do
      vehicles_for_route = Server.subscribe_to_route("1", server_pid)
      assert vehicles_for_route == @vehicles_for_route
    end

    test "clients subscribed to a route get data pushed to them", %{server_pid: server_pid} do
      Server.subscribe_to_route("1", server_pid)

      Server.update_vehicles_by_route_id(@vehicles_by_route_id, server_pid)

      assert_receive(
        {:new_realtime_data, {:vehicles_for_route, vehicles_for_route}},
        200,
        "Client didn't receive vehicle positions"
      )

      assert vehicles_for_route == @vehicles_for_route
    end

    test "clients subscribed to a route get repeated messages", %{server_pid: server_pid} do
      Server.subscribe_to_route("1", server_pid)

      Server.update_vehicles_by_route_id(@vehicles_by_route_id, server_pid)

      assert_receive(
        {:new_realtime_data, _new_vehicles_for_route},
        200,
        "Client didn't receive vehicle positions the first time"
      )

      Server.update_vehicles_by_route_id(@vehicles_by_route_id, server_pid)

      assert_receive(
        {:new_realtime_data, _new_vehicles_for_route},
        200,
        "Client didn't receive vehicle positions the second time"
      )
    end
  end

  describe "subscribe_to_all_shuttles" do
    setup do
      reassign_env(:realtime, :trip_fn, fn _trip_id -> nil end)
      reassign_env(:realtime, :block_fn, fn _block_id, _service_id -> nil end)

      {:ok, server_pid} = Server.start_link([])

      :ok = Server.update_shuttles([@shuttle], server_pid)

      %{server_pid: server_pid}
    end

    test "clients get all shuttles upon subscribing", %{server_pid: pid} do
      assert Server.subscribe_to_all_shuttles(pid) == [@shuttle]
    end

    test "clients get updated data pushed to them", %{server_pid: pid} do
      Server.subscribe_to_all_shuttles(pid)

      Server.update_shuttles([@shuttle, @shuttle], pid)

      assert_receive {:new_realtime_data, {:shuttles, shuttles}}
      assert shuttles == [@shuttle, @shuttle]
    end
  end

  describe "backend implementation" do
    test "handles reference info calls that come in after a timeout" do
      state = %Server{}

      response = Server.handle_info({make_ref(), []}, state)

      assert response == {:noreply, state}
    end
  end
end
