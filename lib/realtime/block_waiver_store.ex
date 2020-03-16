defmodule Realtime.BlockWaiverStore do
  @moduledoc """
  Server for setting and getting StopTimeUpdates.
  """

  use GenServer

  alias Gtfs.{Block, Service}
  alias Realtime.BlockWaiver

  @type t :: %__MODULE__{
          block_waivers_by_block_and_service_ids: block_waivers_by_block_and_service_ids()
        }

  @type block_waivers_by_block_and_service_ids :: %{Block.key() => [BlockWaiver.t()]}

  defstruct block_waivers_by_block_and_service_ids: %{}

  # Client

  @spec default_name() :: GenServer.name()
  def default_name(), do: Realtime.BlockWaiverStore

  @spec start_link() :: GenServer.on_start()
  @spec start_link(Keyword.t()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, nil, name: Keyword.get(opts, :name, default_name()))
  end

  @spec block_waivers_for_block_and_service(Block.id(), Service.id()) :: [BlockWaiver.t()]
  @spec block_waivers_for_block_and_service(Block.id(), Service.id(), GenServer.server()) :: [
          BlockWaiver.t()
        ]
  def block_waivers_for_block_and_service(block_id, service_id, server \\ default_name()) do
    GenServer.call(server, {:block_waivers_for_block_and_service, block_id, service_id})
  end

  @spec set(block_waivers_by_block_and_service_ids()) :: :ok
  @spec set(block_waivers_by_block_and_service_ids(), GenServer.server()) :: :ok
  def set(block_waivers_by_block_and_service_ids, server \\ default_name()) do
    GenServer.cast(server, {:set, block_waivers_by_block_and_service_ids})
  end

  # Server

  @impl GenServer
  def init(_) do
    {:ok, %__MODULE__{}}
  end

  @impl true
  def handle_call(
        {:block_waivers_for_block_and_service, block_id, service_id},
        _from,
        %__MODULE__{
          block_waivers_by_block_and_service_ids: block_waivers_by_block_and_service_ids
        } = state
      ) do
    block_waivers = Map.get(block_waivers_by_block_and_service_ids, {block_id, service_id}, [])

    {:reply, block_waivers, state}
  end

  @impl true
  def handle_cast(
        {:set, block_waivers_by_block_and_service_ids},
        %__MODULE__{} = state
      ) do
    {:noreply,
     Map.put(
       state,
       :block_waivers_by_block_and_service_ids,
       block_waivers_by_block_and_service_ids
     )}
  end
end
