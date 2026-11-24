defmodule Skate.Telemetry.SocketsTest do
  @moduledoc false
  use SkateWeb.ChannelCase

  import ExUnit.CaptureLog
  import Test.Support.Helpers, only: [reassign_env: 3, set_log_level: 1]

  alias Phoenix.{LiveReloader, Socket}
  alias Skate.Telemetry.Sockets.Monitor
  alias SkateWeb.{AuthManager, DetoursChannel, Endpoint, UserSocket}

  @ws_init {%{}, %Socket{transport: :websocket, endpoint: Endpoint, handler: UserSocket}}

  setup do
    set_log_level(:info)
  end

  test "logs ws.socket_connected and ws.channel_joined without leaking tokens or topics" do
    reassign_env(:skate, :valid_token_fn, fn _socket -> true end)

    {:ok, token, _claims} =
      AuthManager.encode_and_sign(%{id: 1}, %{"exp" => System.system_time(:second) + 500})

    invalid_token = "invalid-secret-token"
    topic = "detours:active:57"

    log =
      capture_log([level: :info], fn ->
        assert {:ok, socket} = connect(UserSocket, %{"token" => token})
        assert :error = connect(UserSocket, %{"token" => invalid_token})
        assert {:ok, %{data: []}, _socket} = subscribe_and_join(socket, DetoursChannel, topic)
      end)

    assert [ok_connect, err_connect, joined] = ws_lines(log)

    assert ok_connect =~
             ~r/event=ws\.socket_connected transport=Phoenix\.ChannelTest result=:ok duration_ms=\d+/

    assert err_connect =~
             ~r/event=ws\.socket_connected transport=Phoenix\.ChannelTest result=:error duration_ms=\d+/

    assert joined =~
             ~r/event=ws\.channel_joined channel=SkateWeb\.DetoursChannel result=:ok duration_ms=\d+/

    ws_log = Enum.join([ok_connect, err_connect, joined], "\n")
    refute ws_log =~ token
    refute ws_log =~ invalid_token
    refute ws_log =~ topic
  end

  test "excludes Phoenix.LiveReloader socket and channel events" do
    meta = %{user_socket: LiveReloader.Socket, transport: :websocket, result: :ok, log: false}
    reloader = %Socket{channel: LiveReloader.Channel, topic: "phoenix:live_reload"}
    join_meta = %{socket: reloader, result: :ok}

    log =
      capture_log([level: :info], fn ->
        :telemetry.execute([:phoenix, :socket_connected], %{duration: 1_000}, meta)
        :telemetry.execute([:phoenix, :channel_joined], %{duration: 1_000}, join_meta)
      end)

    assert ws_lines(log) == []
  end

  test "UserSocket init/1 and terminate/2 log ws.socket_disconnected once without :DOWN double-report" do
    log =
      capture_log([level: :info], fn ->
        task =
          Task.async(fn ->
            {:ok, initialized} = UserSocket.init(@ws_init)
            assert Map.has_key?(:sys.get_state(Monitor), self())
            :ok = UserSocket.terminate({:error, :closed}, initialized)
          end)

        :ok = Task.await(task)
        refute Map.has_key?(:sys.get_state(Monitor), task.pid)
      end)

    assert [line] = ws_lines(log)

    assert line =~
             ~r/event=ws\.socket_disconnected transport=:websocket reason='\{:error, :closed\}' duration_ms=\d+/
  end

  test "UserSocket terminate/2 logs ws.socket_disconnected cleanly if Monitor restarts mid-connection" do
    log =
      capture_log([level: :info], fn ->
        task =
          Task.async(fn ->
            {:ok, initialized} = UserSocket.init(@ws_init)
            old_pid = Process.whereis(Monitor)
            :ok = GenServer.stop(old_pid)
            [{Monitor, new_pid, :worker, _}] = Supervisor.which_children(Monitor.Supervisor)
            assert is_pid(new_pid) and new_pid != old_pid
            :ok = UserSocket.terminate({:error, :closed}, initialized)
          end)

        :ok = Task.await(task)
        refute Map.has_key?(:sys.get_state(Monitor), task.pid)
      end)

    assert [line] = ws_lines(log)

    assert line =~
             ~r/event=ws\.socket_disconnected transport=:websocket reason='\{:error, :closed\}' duration_ms=\d+/
  end

  test "Monitor logs ws.socket_disconnected via :DOWN when a tracked process is killed" do
    test_pid = self()

    pid =
      spawn(fn ->
        {:ok, _initialized} = UserSocket.init(@ws_init)
        send(test_pid, :ready)
        Process.sleep(:infinity)
      end)

    assert_receive :ready
    assert Map.has_key?(:sys.get_state(Monitor), pid)

    monitor_pid = Process.whereis(Monitor)
    :erlang.trace(monitor_pid, true, [:receive])

    on_exit(fn ->
      if Process.alive?(monitor_pid), do: :erlang.trace(monitor_pid, false, [:receive])
    end)

    log =
      capture_log([level: :info], fn ->
        Process.exit(pid, :kill)
        assert_receive {:trace, ^monitor_pid, :receive, {:DOWN, _, :process, ^pid, :killed}}
        :erlang.trace(monitor_pid, false, [:receive])
        refute Map.has_key?(:sys.get_state(Monitor), pid)
      end)

    assert [line] = ws_lines(log)

    assert line =~
             ~r/event=ws\.socket_disconnected transport=:websocket reason=':killed' duration_ms=\d+/
  end

  defp ws_lines(log), do: for(line <- String.split(log, "\n"), line =~ "event=ws.", do: line)
end
