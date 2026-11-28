defmodule SkateWeb.SocketMonitorTest do
  @moduledoc false
  use SkateWeb.ChannelCase

  import ExUnit.CaptureLog
  import Test.Support.Helpers, only: [set_log_level: 1]

  alias Phoenix.Socket
  alias SkateWeb.{Endpoint, SocketMonitor, UserSocket}

  @user_socket_init {
    %{},
    %Socket{transport: :websocket, endpoint: Endpoint, handler: UserSocket}
  }

  setup do
    set_log_level(:info)
  end

  describe "UserSocket" do
    test "logs exactly once after init/1 and terminate/2" do
      log =
        capture_log([level: :info], fn ->
          task =
            Task.async(fn ->
              {:ok, initialized} = UserSocket.init(@user_socket_init)

              assert Map.has_key?(:sys.get_state(SocketMonitor), self())

              :ok = UserSocket.terminate({:error, :closed}, initialized)
            end)

          :ok = Task.await(task)

          refute Map.has_key?(:sys.get_state(SocketMonitor), task.pid)
        end)

      assert log =~
               ~r/event=phoenix\.socket_disconnected reason='\{:error, :closed\}' duration=\d+/
    end
  end

  describe "SocketMonitor" do
    test "logs when a tracked process is killed" do
      test_pid = self()

      socket_pid =
        spawn(fn ->
          {:ok, _initialized} = UserSocket.init(@user_socket_init)
          send(test_pid, :ready)
          Process.sleep(:infinity)
        end)

      assert_receive :ready
      assert Map.has_key?(:sys.get_state(SocketMonitor), socket_pid)

      socket_monitor_pid = Process.whereis(SocketMonitor)
      :erlang.trace(socket_monitor_pid, true, [:receive])

      on_exit(fn ->
        if Process.alive?(socket_monitor_pid) do
          :erlang.trace(socket_monitor_pid, false, [:receive])
        end
      end)

      log =
        capture_log([level: :info], fn ->
          Process.exit(socket_pid, :kill)

          assert_receive {
            :trace,
            ^socket_monitor_pid,
            :receive,
            {:DOWN, _, :process, ^socket_pid, :killed}
          }

          :erlang.trace(socket_monitor_pid, false, [:receive])

          refute Map.has_key?(:sys.get_state(SocketMonitor), socket_pid)
        end)

      assert log =~
               ~r/event=phoenix\.socket_disconnected reason=':killed' duration=\d+/
    end
  end
end
