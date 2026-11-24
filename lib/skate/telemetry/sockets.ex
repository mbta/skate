defmodule Skate.Telemetry.Sockets do
  @moduledoc """
  Telemetry handlers and transport monitor for WebSocket and Channel lifecycle events.
  """
  require Logger

  alias Phoenix.{LiveReloader, Socket}

  @events [[:phoenix, :socket_connected], [:phoenix, :channel_joined]]

  def attach_handler(id \\ "skate.telemetry.sockets", config \\ %{}) do
    :telemetry.attach_many(id, @events, &__MODULE__.handle_event/4, config)
  end

  def report_socket_disconnected(duration, transport, reason) do
    duration_ms = System.convert_time_unit(duration, :native, :millisecond)
    inspected_reason = inspect(reason, limit: 5, printable_limit: 64, charlists: :as_lists)

    Logger.info(fn ->
      "event=ws.socket_disconnected transport=#{inspect(transport)} reason='#{inspected_reason}' duration_ms=#{duration_ms}"
    end)
  end

  @doc false
  def handle_event(
        [:phoenix, :socket_connected],
        %{duration: duration},
        %{user_socket: user_socket, transport: transport, result: result},
        _config
      )
      when user_socket != LiveReloader.Socket do
    duration_ms = System.convert_time_unit(duration, :native, :millisecond)

    Logger.info(fn ->
      "event=ws.socket_connected transport=#{inspect(transport)} result=#{inspect(result)} duration_ms=#{duration_ms}"
    end)
  end

  def handle_event(
        [:phoenix, :channel_joined],
        %{duration: duration},
        %{socket: %Socket{channel: channel}, result: result},
        _config
      )
      when channel != LiveReloader.Channel do
    duration_ms = System.convert_time_unit(duration, :native, :millisecond)

    Logger.info(fn ->
      "event=ws.channel_joined channel=#{inspect(channel)} result=#{inspect(result)} duration_ms=#{duration_ms}"
    end)
  end

  def handle_event(_event, _measurements, _metadata, _config), do: :ok

  defmodule Monitor do
    @moduledoc """
    Passively observes WebSocket transport processes to report 1-to-1 `ws.socket_disconnected` events.
    """
    use GenServer

    alias Phoenix.Socket
    alias Skate.Telemetry.Sockets

    @ws_key :skate_ws_connected_at

    defmodule Supervisor do
      @moduledoc false
      use Elixir.Supervisor

      alias Skate.Telemetry.Sockets.Monitor

      def start_link(opts \\ []) do
        Elixir.Supervisor.start_link(__MODULE__, opts, name: __MODULE__)
      end

      @impl Elixir.Supervisor
      def init(_opts), do: Elixir.Supervisor.init([Monitor], strategy: :one_for_one)
    end

    def start_link(opts \\ []) do
      GenServer.start_link(__MODULE__, %{}, name: Keyword.get(opts, :name, __MODULE__))
    end

    def track(socket, server \\ __MODULE__)

    def track(%Socket{transport: :websocket, transport_pid: pid}, server) when pid == self() do
      connected_at = System.monotonic_time()
      Process.put(@ws_key, {connected_at, server})
      GenServer.cast(server, {:track, pid, connected_at})
    end

    def track(_socket, _server), do: :ok

    def untrack(%Socket{transport: :websocket}, reason) do
      case Process.delete(@ws_key) do
        {connected_at, server} when is_integer(connected_at) ->
          GenServer.cast(server, {:untrack, self()})
          duration = max(System.monotonic_time() - connected_at, 0)
          Sockets.report_socket_disconnected(duration, :websocket, reason)

        _ ->
          :ok
      end
    end

    def untrack(_socket, _reason), do: :ok

    @impl GenServer
    def init(state), do: {:ok, state}

    @impl GenServer
    def handle_cast({:track, pid, connected_at}, state) do
      prev = Map.get(state, pid)
      if prev, do: Process.demonitor(elem(prev, 0), [:flush])
      {:noreply, Map.put(state, pid, {Process.monitor(pid), connected_at})}
    end

    @impl GenServer
    def handle_cast({:untrack, pid}, state) do
      {entry, next_state} = Map.pop(state, pid)
      if entry, do: Process.demonitor(elem(entry, 0), [:flush])
      {:noreply, next_state}
    end

    @impl GenServer
    def handle_info({:DOWN, ref, :process, pid, exit_reason}, state) do
      case Map.get(state, pid) do
        {^ref, connected_at} ->
          duration = max(System.monotonic_time() - connected_at, 0)
          Sockets.report_socket_disconnected(duration, :websocket, exit_reason)
          {:noreply, Map.delete(state, pid)}

        _ ->
          {:noreply, state}
      end
    end

    def handle_info(_msg, state), do: {:noreply, state}
  end
end
