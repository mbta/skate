defmodule Realtime.Server do
  @moduledoc """
  Fetches live data from RTR, and forwards it to connected clients.
  """

  use GenServer

  alias Gtfs.Route
  require Logger

  @type opts :: [url: String.t(), poll_delay: integer()]

  @type subscriptions :: %{optional(pid()) => [Route.id()]}

  @type vehicles :: %{optional(Route.id()) => [Realtime.Vehicle.t()]}

  @type state :: %{
          url: String.t(),
          poll_delay: integer(),
          subscriptions: subscriptions(),
          vehicles_timestamp: integer() | nil,
          vehicles: vehicles()
        }

  # Client functions

  @spec start_link(opts()) :: GenServer.on_start()
  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @spec start_mocked(opts()) :: pid()
  def start_mocked(opts) do
    {:ok, pid} = GenServer.start_link(__MODULE__, opts)
    pid
  end

  @spec subscribe([Route.id()], GenServer.server()) :: vehicles()
  def subscribe(route_ids, server \\ nil) do
    server = server || __MODULE__
    GenServer.call(server, {:subscribe, route_ids, self()})
  end

  # GenServer callbacks

  @impl true
  def init(url: url, poll_delay: poll_delay) do
    initial_state = %{
      url: url,
      poll_delay: poll_delay,
      subscriptions: Map.new(),
      vehicles_timestamp: nil,
      vehicles: Map.new()
    }

    {:ok, initial_state, {:continue, :poll}}
  end

  @impl true
  def handle_continue(:poll, state) do
    case fetch(state.url) do
      {:ok, vehicles} ->
        Process.send_after(self(), :poll, state.poll_delay)
        {:noreply, %{state | vehicles: vehicles}}

      {:error, error} ->
        {:stop, error}
    end
  end

  @impl true
  def handle_info(:poll, state) do
    new_state =
      case fetch(state.url) do
        {:ok, vehicles} ->
          broadcast(vehicles, state.subscriptions)
          %{state | vehicles: vehicles}

        _ ->
          state
      end

    Process.send_after(self(), :poll, state.poll_delay)
    {:noreply, new_state}
  end

  def handle_info({:DOWN, _monitor_ref, :process, pid, _reason}, state) do
    {:noreply, %{state | subscriptions: Map.delete(state.subscriptions, pid)}}
  end

  @impl true
  def handle_call({:subscribe, route_ids, pid}, _from, state) do
    Process.monitor(pid)

    {:reply, Map.take(state.vehicles, route_ids),
     %{state | subscriptions: Map.put(state.subscriptions, pid, route_ids)}}
  end

  @spec fetch(String.t()) :: {:ok, vehicles()} | {:error, any()}
  defp fetch(url) do
    case HTTPoison.get(url) do
      {:ok, %HTTPoison.Response{status_code: 200, body: json_string}} ->
        case Jason.decode(json_string) do
          {:ok, json} ->
            {:ok, decode_data(json)}

          {:error, error} ->
            Logger.warn(fn -> "Failed to decode json : #{inspect(error)}" end)
            {:error, error}
        end

      response ->
        Logger.warn(fn -> "Unexpected response from #{url} : #{inspect(response)}" end)
        {:error, response}
    end
  end

  @spec broadcast(vehicles(), subscriptions()) :: :ok
  defp broadcast(vehicles, subscriptions) do
    Enum.each(
      subscriptions,
      fn {pid, route_ids} ->
        send(pid, {:new_realtime_data, Map.take(vehicles, route_ids)})
      end
    )
  end

  @spec decode_data(term()) :: vehicles()
  def decode_data(json) do
    json["entity"]
    |> Enum.map(&Realtime.Vehicle.decode/1)
    |> Enum.group_by(fn vehicle -> vehicle.route_id end)
  end
end
