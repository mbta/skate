defmodule Realtime.DataStatusAlerterTest do
  use ExUnit.Case
  import ExUnit.CaptureLog

  alias Realtime.DataStatusAlerter

  describe "start_link/1" do
    test "starts up and lives" do
      {:ok, server} = DataStatusAlerter.start_link(name: :start_link, subscribe_fn: fn -> nil end)

      Process.sleep(10)

      assert Process.alive?(server)
    end
  end

  describe "init/1" do
    test "calls the supplied subscribe_fn" do
      test_pid = self()
      mock_subscribe_fn = fn -> send(test_pid, "hi") end
      DataStatusAlerter.init(%{subscribe_fn: mock_subscribe_fn})
      assert_received("hi")
    end
  end

  describe "handle_info/2" do
    test "logs a warning if data status is :outage" do
      log =
        capture_log(fn ->
          DataStatusAlerter.handle_info({:new_data_status, :outage}, nil)
        end)

      assert String.contains?(log, "Data outage detected data_outage_detected")
    end

    test "logs nothing if data status is :good" do
      log =
        capture_log(fn ->
          DataStatusAlerter.handle_info({:new_data_status, :good}, nil)
        end)

      refute String.contains?(log, "data_outage_detected")
    end
  end
end
