defmodule Realtime.DataStatusPubSub do
  @moduledoc """

  Uses a global regsitry, with this genserver's pid as the key.
  """

  use GenServer

  alias Realtime.DataStatus

  require Logger

  @typep t :: %__MODULE__{
           data_status: DataStatus.t()
         }

  defstruct data_status: :outage

  # Client functions

  @spec default_name() :: GenServer.name()
  def default_name(), do: Realtime.DataStatusPubSub

  @spec start_link(Keyword.t()) :: GenServer.on_start()
  def start_link(start_link_opts) do
    GenServer.start_link(__MODULE__, [], start_link_opts)
  end

  @doc """
  The subscribing process will get a message when there's new data, with the form
  ```
  {:new_data_status, data_status}
  ```
  """
  @spec subscribe(GenServer.server()) :: DataStatus.t()
  def subscribe(server \\ default_name()) do
    {registry_key, data_status} = GenServer.call(server, :subscribe)
    Registry.register(Realtime.Registry, registry_key, :value_does_not_matter)
    data_status
  end

  @spec update(DataStatus.t(), GenServer.server()) :: :ok
  def update(data_status, server \\ __MODULE__) do
    GenServer.cast(server, {:update, data_status})
    :ok
  end

  # GenServer callbacks

  @impl true
  def init(_opts) do
    {:ok, %__MODULE__{}}
  end

  # If we get a reply after we've already timed out, ignore it
  @impl true
  def handle_info({reference, _}, state) when is_reference(reference),
    do: {:noreply, state}

  @impl true
  def handle_call(:subscribe, _from, state) do
    registry_key = self()
    {:reply, {registry_key, state.data_status}, state}
  end

  @impl true
  def handle_cast({:update, data_status}, state) do
    new_state = Map.put(state, :data_status, data_status)
    _ = broadcast(new_state)
    {:noreply, new_state}
  end

  @spec broadcast(t()) :: :ok
  defp broadcast(state) do
    registry_key = self()

    Registry.dispatch(Realtime.Supervisor.registry_name(), registry_key, fn entries ->
      Enum.each(entries, fn {pid, _} -> send(pid, {:new_data_status, state.data_status}) end)
    end)
  end
end
