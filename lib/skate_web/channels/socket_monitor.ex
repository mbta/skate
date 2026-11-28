defmodule SkateWeb.SocketMonitor do
  @moduledoc """
  Monitor Phoenix Socket (WebSocket transport) processes.
  """

  use GenServer

  require Logger

  alias Phoenix.Socket

  @doc false
  @spec monitor(Socket.t(), GenServer.server()) :: :ok
  def monitor(socket, server \\ __MODULE__)

  def monitor(%Socket{transport: :websocket, transport_pid: transport_pid}, server)
      when transport_pid == self() do
    GenServer.cast(server, {:monitor, transport_pid, System.monotonic_time()})
  end

  def monitor(_, _), do: :ok

  @doc false
  @spec demonitor(Socket.t(), term(), GenServer.server()) :: :ok
  def demonitor(socket, reason, server \\ __MODULE__)

  def demonitor(
        %Socket{transport: :websocket, transport_pid: transport_pid},
        reason,
        server
      )
      when transport_pid == self() do
    GenServer.cast(server, {:demonitor, transport_pid, reason})
  end

  def demonitor(_, _, _), do: :ok

  @doc false
  @spec start_link(GenServer.options()) :: GenServer.on_start()
  def start_link(options \\ []) do
    GenServer.start_link(
      __MODULE__,
      %{},
      Keyword.merge([name: __MODULE__], options)
    )
  end

  @doc false
  @impl GenServer
  @spec init(map()) :: {:ok, map()}
  def init(%{} = state), do: {:ok, state}

  @impl GenServer
  @spec handle_cast(
          {:monitor, pid(), integer()} | {:demonitor, pid(), term()},
          map()
        ) :: {:noreply, map()}
  def handle_cast(request, state)

  def handle_cast({:monitor, transport_pid, connected_at}, state)
      when is_pid(transport_pid) and is_integer(connected_at) do
    case Map.get(state, transport_pid) do
      {ref, _} -> Process.demonitor(ref, [:flush])
      _ -> :ok
    end

    {
      :noreply,
      Map.put(state, transport_pid, {Process.monitor(transport_pid), connected_at})
    }
  end

  def handle_cast({:demonitor, transport_pid, reason}, state)
      when is_pid(transport_pid) do
    case Map.pop(state, transport_pid) do
      {nil, state} ->
        {:noreply, state}

      {{ref, connected_at}, state} ->
        Logger.info(fn ->
          "event=phoenix.socket_disconnected " <>
            "reason='#{inspect(reason)}' " <>
            "duration=#{max(System.monotonic_time() - connected_at, 0)}"
        end)

        Process.demonitor(ref, [:flush])
        {:noreply, state}
    end
  end

  def handle_cast(_, state), do: {:noreply, state}

  @doc false
  @impl GenServer
  @spec handle_info({:DOWN, reference(), :process, pid(), term()}, map()) ::
          {:noreply, map()}
  def handle_info(message, state)

  def handle_info({:DOWN, ref, :process, transport_pid, reason}, state) do
    case Map.pop(state, transport_pid) do
      {{^ref, connected_at}, state} ->
        Logger.info(fn ->
          "event=phoenix.socket_disconnected " <>
            "reason='#{inspect(reason)}' " <>
            "duration=#{max(System.monotonic_time() - connected_at, 0)}"
        end)

        {:noreply, state}

      _ ->
        {:noreply, state}
    end
  end

  def handle_info(_, state), do: {:noreply, state}

  defmodule Supervisor do
    @moduledoc false

    use Elixir.Supervisor

    @doc false
    @spec start_link([Elixir.Supervisor.option()]) :: Elixir.Supervisor.on_start()
    def start_link(options \\ []) do
      Elixir.Supervisor.start_link(
        __MODULE__,
        nil,
        Keyword.merge([name: __MODULE__], options)
      )
    end

    @doc false
    @impl Elixir.Supervisor
    @spec init(nil) ::
            {:ok,
             {Elixir.Supervisor.sup_flags(),
              [Elixir.Supervisor.child_spec() | :supervisor.child_spec()]}}
    def init(nil) do
      Elixir.Supervisor.init([SkateWeb.SocketMonitor], strategy: :one_for_one)
    end
  end
end
