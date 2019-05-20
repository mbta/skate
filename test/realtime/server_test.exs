defmodule Realtime.ServerTest do
  use ExUnit.Case, async: true

  alias Realtime.Server

  describe "public interface" do
    setup do
      real_trip_fn = Application.get_env(:realtime, :trip_fn)

      on_exit(fn ->
        Application.put_env(:realtime, :trip_fn, real_trip_fn)
      end)

      Application.put_env(:realtime, :trip_fn, fn _trip_id -> nil end)

      bypass = Bypass.open()
      url = "http://localhost:#{bypass.port}/VehiclePositions.json"

      Bypass.expect(bypass, fn conn ->
        sample_data = File.read!(__DIR__ <> "/concentrate_VehiclePositions.json")
        Plug.Conn.resp(conn, 200, sample_data)
      end)

      {:ok, server_pid} =
        Server.start_link(
          url: url,
          poll_delay: 100
        )

      %{server_pid: server_pid}
    end

    test "clients get vehicles when subscribing", %{server_pid: server_pid} do
      data = Server.subscribe("1", server_pid)

      assert [at_least_one_vehicle | _rest] = data
      assert at_least_one_vehicle.route_id == "1"
    end

    test "subscribed clients get data pushed to them", %{server_pid: server_pid} do
      Server.subscribe("1", server_pid)

      assert_receive(
        {:new_realtime_data, data},
        200,
        "Client didn't receive vehicle positions"
      )

      assert [_at_least_one_vehicle | _rest] = data
    end

    test "subscribed clients get repeated messages", %{server_pid: server_pid} do
      Server.subscribe("1", server_pid)

      assert_receive(
        {:new_realtime_data, _new_data},
        200,
        "Client didn't receive vehicle positions the first time"
      )

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
