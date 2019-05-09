defmodule Realtime.Server do
  @moduledoc """
  Fetches live data from RTR, and forwards it to connected clients.

  Uses a global regsitry, with the server's pid as the key.
  Each subscriber's route_id is stored as the value of their registry entries.
  """

  use GenServer

  alias Gtfs.Route
  require Logger

  @type opts :: [url: String.t(), poll_delay: integer()]

  @type vehicles :: %{optional(Route.id()) => [Realtime.Vehicle.t()]}

  @type state :: %{
          url: String.t(),
          poll_delay: integer(),
          vehicles_timestamp: integer() | nil,
          vehicles: vehicles()
        }

  # Client functions

  @spec registry_name() :: Registry.registry()
  def registry_name(), do: Realtime.Registry

  @spec default_name() :: GenServer.name()
  def default_name(), do: Realtime.Server

  @spec start_link(opts()) :: GenServer.on_start()
  def start_link(opts) do
    {start_link_opts, server_opts} = Keyword.split(opts, [:name])
    GenServer.start_link(__MODULE__, server_opts, start_link_opts)
  end

  @doc """
  The subscribing process will get a message when there's new data, with the form
  {:new_realtime_data, vehicles()}
  """
  @spec subscribe(Route.id(), GenServer.server()) :: vehicles()
  def subscribe(route_id, server \\ nil) do
    server = server || default_name()
    {registry_key, vehicles} = GenServer.call(server, {:subscribe, route_id})
    Registry.register(Realtime.Registry, registry_key, route_id)
    vehicles
  end

  # GenServer callbacks

  @impl true
  def init(url: url, poll_delay: poll_delay) do
    initial_state = %{
      url: url,
      poll_delay: poll_delay,
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
          broadcast(vehicles)
          %{state | vehicles: vehicles}

        _ ->
          state
      end

    Process.send_after(self(), :poll, state.poll_delay)
    {:noreply, new_state}
  end

  # If we get a reply after we've already timed out, ignore it
  @impl true
  def handle_info({reference, _}, state) when is_reference(reference), do: {:noreply, state}

  @impl true
  def handle_call({:subscribe, route_id}, _from, state) do
    registry_key = self()
    vehicles = Map.get(state.vehicles, route_id, [])
    {:reply, {registry_key, vehicles}, state}
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

  @spec broadcast(vehicles()) :: :ok
  defp broadcast(vehicles) do
    registry_key = self()

    Registry.dispatch(registry_name(), registry_key, fn entries ->
      for {pid, route_id} <- entries do
        send(pid, {:new_realtime_data, Map.get(vehicles, route_id, [])})
      end
    end)
  end

  @spec decode_data(term()) :: vehicles()
  def decode_data(json) do
    json["entity"]
    |> Enum.map(&Realtime.Vehicle.decode/1)
    |> Enum.group_by(fn vehicle -> vehicle.route_id end)
  end
end
