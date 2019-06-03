defmodule Realtime.ServerTest do
  use ExUnit.Case, async: true

  alias Realtime.{Server, Vehicle}

  @vehicles_by_route_id %{
    "1" => [
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
    "66" => [
      %Vehicle{
        id: "v2",
        label: "v2-label",
        timestamp: 1_558_121_738,
        latitude: 42.362946519,
        longitude: -71.0579357,
        direction_id: 1,
        route_id: "66",
        trip_id: "t2",
        bearing: 90,
        speed: 1.0,
        stop_sequence: 5,
        block_id: "G111-155",
        operator_id: "70112",
        operator_name: "PANIAGUA",
        run_id: "126-1430",
        stop_status: %{
          status: :in_transit_to,
          stop_id: "s2"
        },
        timepoint_status: %{
          timepoint_id: "tp2",
          fraction_until_timepoint: 0.9
        },
        route_status: :on_route
      }
    ]
  }

  describe "public interface" do
    setup do
      real_trip_fn = Application.get_env(:realtime, :trip_fn)

      on_exit(fn ->
        Application.put_env(:realtime, :trip_fn, real_trip_fn)
      end)

      Application.put_env(:realtime, :trip_fn, fn _trip_id -> nil end)

      {:ok, server_pid} = Server.start_link([])

      Server.update_vehicles(@vehicles_by_route_id, server_pid)

      %{server_pid: server_pid}
    end

    test "clients get vehicles when subscribing", %{server_pid: server_pid} do
      data = Server.subscribe("1", server_pid)

      assert [at_least_one_vehicle | _rest] = data
      assert at_least_one_vehicle.route_id == "1"
    end

    test "subscribed clients get data pushed to them", %{server_pid: server_pid} do
      Server.subscribe("1", server_pid)

      Server.update_vehicles(@vehicles_by_route_id, server_pid)

      assert_receive(
        {:new_realtime_data, data},
        200,
        "Client didn't receive vehicle positions"
      )

      assert [_at_least_one_vehicle | _rest] = data
    end

    test "subscribed clients get repeated messages", %{server_pid: server_pid} do
      Server.subscribe("1", server_pid)

      Server.update_vehicles(@vehicles_by_route_id, server_pid)

      assert_receive(
        {:new_realtime_data, _new_data},
        200,
        "Client didn't receive vehicle positions the first time"
      )

      Server.update_vehicles(@vehicles_by_route_id, server_pid)

      assert_receive(
        {:new_realtime_data, _new_data},
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
