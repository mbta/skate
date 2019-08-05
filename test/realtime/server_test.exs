defmodule Realtime.ServerTest do
  use ExUnit.Case, async: true
  import Test.Support.Helpers

  alias Realtime.{Server, Vehicle}

  @vehicles_for_route %{
    on_route_vehicles: [
      %Vehicle{
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
    ],
    incoming_vehicles: []
  }

  @vehicles_by_route_id %{
    "1" => @vehicles_for_route
  }

  describe "public interface" do
    setup do
      reassign_env(:realtime, :trip_fn, fn _trip_id -> nil end)
      reassign_env(:realtime, :block_fn, fn _block_id, _service_id -> nil end)

      {:ok, server_pid} = Server.start_link([])

      Server.update_vehicles(@vehicles_by_route_id, server_pid)

      %{server_pid: server_pid}
    end

    test "clients get vehicles when subscribing", %{server_pid: server_pid} do
      vehicles_for_route = Server.subscribe("1", server_pid)
      assert vehicles_for_route == @vehicles_for_route
    end

    test "subscribed clients get data pushed to them", %{server_pid: server_pid} do
      Server.subscribe("1", server_pid)

      Server.update_vehicles(@vehicles_by_route_id, server_pid)

      assert_receive(
        {:new_realtime_data, vehicles_for_route},
        200,
        "Client didn't receive vehicle positions"
      )

      assert vehicles_for_route == @vehicles_for_route
    end

    test "subscribed clients get repeated messages", %{server_pid: server_pid} do
      Server.subscribe("1", server_pid)

      Server.update_vehicles(@vehicles_by_route_id, server_pid)

      assert_receive(
        {:new_realtime_data, _new_vehicles_for_route},
        200,
        "Client didn't receive vehicle positions the first time"
      )

      Server.update_vehicles(@vehicles_by_route_id, server_pid)

      assert_receive(
        {:new_realtime_data, _new_vehicles_for_route},
        200,
        "Client didn't receive vehicle positions the second time"
      )
    end
  end

  describe "backend implementation" do
    test "handles reference info calls that come in after a timeout" do
      state = %{
        url: "http://example.com",
        poll_delay: 1,
        vehicles_timestamp: nil,
        vehicles: []
      }

      response = Server.handle_info({make_ref(), []}, state)

      assert response == {:noreply, state}
    end
  end
end
