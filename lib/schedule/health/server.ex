defmodule Schedule.Health.Server do
  @moduledoc """
  GenServer to keep track of whether the GTFS GenServer is up and running
  """

  use GenServer

  @type state :: :not_ready | :ready

  # Client functions

  @spec default_server() :: GenServer.server()
  def default_server(), do: __MODULE__

  @spec start_link([]) :: GenServer.on_start()
  def start_link([]) do
    GenServer.start_link(__MODULE__, nil, name: default_server())
  end

  @spec start_mocked() :: pid()
  def start_mocked() do
    {:ok, pid} = GenServer.start_link(__MODULE__, nil)
    pid
  end

  @spec loaded(GenServer.server()) :: :ok
  def loaded(server) do
    GenServer.cast(server, :loaded)
  end

  @spec ready?(GenServer.server()) :: boolean()
  def ready?(server) do
    GenServer.call(server, :ready?)
  end

  # Server functions

  @impl true
  def init(nil) do
    {:ok, :not_ready}
  end

  @impl true
  def handle_cast(:loaded, _state) do
    checker_healthy_fn =
      Application.get_env(:skate, :checker_healthy_fn, &Schedule.Health.Checker.healthy?/0)

    healthy? = checker_healthy_fn.()
    new_state = if healthy?, do: :ready, else: :not_ready

    {:noreply, new_state}
  end

  @impl true
  def handle_call(:ready?, _from, :not_ready = state), do: {:reply, false, state}
  def handle_call(:ready?, _from, :ready = state), do: {:reply, true, state}
end
