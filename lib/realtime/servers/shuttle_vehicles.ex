defmodule Realtime.Servers.ShuttleVehicles do
  @moduledoc """
  Fetches live data from RTR, and forwards it to connected clients.

  Uses a global regsitry, with the server's pid as the key.
  Each subscriber's route_id is stored as the value of their registry entries.
  """

  use GenServer

  alias Realtime.Vehicle

  @typep state :: %{Vehicle.run_id() => [Vehicle.t()]}

  @typep subscription_key :: :run_ids | :all_shuttles | {:run_id, Vehicle.run_id()}

  @type broadcast_data :: {:shuttles, [Vehicle.t()]} | {:run_ids, [Vehicle.run_id()]}

  # Client functions

  @spec default_name() :: GenServer.name()
  def default_name(), do: __MODULE__

  @spec start_link(Keyword.t()) :: GenServer.on_start()
  def start_link(start_link_opts) do
    GenServer.start_link(__MODULE__, [], start_link_opts)
  end

  @doc """
  The subscribing process will get a message when there's new data, with the form
  {:new_realtime_data, {:shuttles, [Vehicle.t()]}}
  """
  @spec subscribe_to_run(Vehicle.run_id(), GenServer.server()) :: [Vehicle.t()]
  def subscribe_to_run(run_id, server \\ default_name())
      when is_binary(run_id) do
    subscribe({:run_id, run_id}, server)
  end

  @spec subscribe_to_all_shuttles(GenServer.server()) :: [Vehicle.t()]
  def subscribe_to_all_shuttles(server \\ default_name()) do
    subscribe(:all_shuttles, server)
  end

  @doc """
  The subscribing process will get a message when there's new data, with the form
  {:new_realtime_data, {:run_ids, [Vehicle.run_id()]}}
  """
  @spec subscribe_to_run_ids(GenServer.server()) :: [Vehicle.run_id()]
  def subscribe_to_run_ids(server \\ default_name()) do
    subscribe(:run_ids, server)
  end

  @spec subscribe(subscription_key, GenServer.server()) :: [Vehicle.t()] | [Vehicle.run_id()]
  defp subscribe(subscription_key, server) do
    {registry_key, data} = GenServer.call(server, {:subscribe, subscription_key})
    Registry.register(Realtime.Registry, registry_key, subscription_key)
    data
  end

  @spec update(state) :: term()
  def update(shuttles_by_run_id, server \\ __MODULE__) when is_map(shuttles_by_run_id) do
    GenServer.cast(server, {:update, shuttles_by_run_id})
  end

  # GenServer callbacks

  @impl true
  def init(_opts) do
    {:ok, %{}}
  end

  # If we get a reply after we've already timed out, ignore it
  @impl true
  def handle_info({reference, _}, state) when is_reference(reference), do: {:noreply, state}

  @impl true
  def handle_call({:subscribe, subscription_key}, _from, state) do
    registry_key = self()
    {_, data} = data_to_send(state, subscription_key)
    {:reply, {registry_key, data}, state}
  end

  @impl true
  def handle_cast({:update, shuttles_by_run_id}, _state) do
    broadcast(shuttles_by_run_id)
    {:noreply, shuttles_by_run_id}
  end

  @spec broadcast(state()) :: :ok
  defp broadcast(shuttles_by_run_id) do
    Registry.dispatch(Realtime.Registry, self(), fn entries ->
      for {pid, subscription_key} <- entries do
        send(pid, {:new_realtime_data, data_to_send(shuttles_by_run_id, subscription_key)})
      end
    end)
  end

  @spec data_to_send(state, subscription_key) :: broadcast_data
  defp data_to_send(shuttles_by_run_id, :run_ids) do
    {:run_ids, Map.keys(shuttles_by_run_id)}
  end

  defp data_to_send(shuttles_by_run_id, :all_shuttles) do
    all_shuttles =
      shuttles_by_run_id
      |> Map.values()
      |> List.flatten()

    {:shuttles, all_shuttles}
  end

  defp data_to_send(shuttles_by_run_id, {:run_id, run_id}) do
    {:shuttles, Map.get(shuttles_by_run_id, run_id, [])}
  end
end
