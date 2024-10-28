defmodule Realtime.BlockWaiverStore do
  @moduledoc """
  Server for setting and getting StopTimeUpdates.
  """

  use GenServer

  alias Schedule.Block
  alias Schedule.Gtfs.Service
  alias Realtime.BlockWaiver

  @type t :: %__MODULE__{
          block_waivers_by_block_key: BlockWaiver.block_waivers_by_block_key(),
          never_set: boolean()
        }

  defstruct block_waivers_by_block_key: %{},
            never_set: true

  # Client

  @spec default_name() :: GenServer.name()
  def default_name(), do: Realtime.BlockWaiverStore

  @spec start_link() :: GenServer.on_start()
  @spec start_link(Keyword.t()) :: GenServer.on_start()
  def start_link(opts \\ [name: default_name()]) do
    # set fullsweep to periodically garbabe collect the fetched schedule data
    # without having to hibernate after every event. The Erlang documentation
    # [https://erlang.org/doc/man/erlang.html#spawn_opt-4] says that processes
    # which mostly have short-lived data can set this to a "suitable value" such
    # as 10 or 20. However, this process was not being garbage-collected
    # frequently enough for a full sweep every 10 or 20 garbage collections to
    # reduce the memory usage, so we do a full sweep after every garbage
    # collection.
    GenServer.start_link(__MODULE__, %__MODULE__{}, [spawn_opt: [fullsweep_after: 0]] ++ opts)
  end

  @spec block_waivers_for_block_and_service(Block.id(), Service.id()) :: [BlockWaiver.t()]
  @spec block_waivers_for_block_and_service(Block.id(), Service.id(), GenServer.server()) :: [
          BlockWaiver.t()
        ]
  def block_waivers_for_block_and_service(block_id, service_id, server \\ default_name()) do
    GenServer.call(server, {:block_waivers_for_block_and_service, block_id, service_id})
  end

  @spec set(BlockWaiver.block_waivers_by_block_key()) :: :ok
  @spec set(BlockWaiver.block_waivers_by_block_key(), GenServer.server()) :: :ok
  def set(block_waivers_by_block_key, server \\ default_name()) do
    GenServer.cast(server, {:set, block_waivers_by_block_key})
  end

  # Server

  @impl GenServer
  def init(initial_state) do
    {:ok, initial_state}
  end

  @impl true
  def handle_call(
        {:block_waivers_for_block_and_service, block_id, service_id},
        _from,
        %__MODULE__{
          block_waivers_by_block_key: block_waivers_by_block_key
        } = state
      ) do
    block_waivers = Map.get(block_waivers_by_block_key, {service_id, block_id}, [])

    {:reply, block_waivers, state}
  end

  @impl true
  def handle_cast(
        {:set, new_block_waivers_by_block_key},
        %__MODULE__{} = state
      ) do
    # We have this never_set flag to detect if this is the first time this
    # particular instance of BlockWaiverStore has had set called on it.
    # Consider what happens if we don't do this check: the first time
    # set is called, it calls waiver_diff to compare
    # new_block_waivers_by_block_key against the existing state. But
    # since we just initialized that state to an empty map, all block
    # waivers will appear to be new, and we end up possibly sending
    # notifications for waivers to users who have already seen them.
    #
    if !state.never_set do
      new_block_waivers =
        waiver_diff(state.block_waivers_by_block_key, new_block_waivers_by_block_key)

      notification_server_new_block_waivers_fn =
        Application.get_env(
          :notifications,
          :notifications_server_new_block_waivers_fn,
          &Notifications.NotificationServer.new_block_waivers/1
        )

      notification_server_new_block_waivers_fn.(new_block_waivers)
    end

    {:noreply,
     %__MODULE__{
       state
       | block_waivers_by_block_key: new_block_waivers_by_block_key,
         never_set: false
     }}
  end

  @spec waiver_diff(
          BlockWaiver.block_waivers_by_block_key(),
          BlockWaiver.block_waivers_by_block_key()
        ) :: %{Block.key() => MapSet.t()}
  defp waiver_diff(old_block_waivers_by_block_key, new_block_waivers_by_block_key) do
    Enum.reduce(
      new_block_waivers_by_block_key,
      %{},
      fn {block_key, new_block_waiver_list}, result ->
        old_block_waiver_list = Map.get(old_block_waivers_by_block_key, block_key, [])
        old_block_waiver_set = MapSet.new(old_block_waiver_list)

        newly_appearing_waivers =
          new_block_waiver_list
          |> MapSet.new()
          |> MapSet.difference(old_block_waiver_set)

        if MapSet.size(newly_appearing_waivers) == 0 do
          result
        else
          Map.put(result, block_key, MapSet.to_list(newly_appearing_waivers))
        end
      end
    )
  end
end
