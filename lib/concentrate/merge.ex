defmodule Concentrate.Merge do
  @moduledoc """
  ProducerConsumer which merges the data given to it, filters, and outputs the result.

  We manage the demand from producers manually.
  * On subscription, we ask for 1 event
  * Once we've received an event, schedule a timeout for 1s
  * When the timeout happens, merge and filter the current state
  * Request new events from producers who were part of the last merge
  """
  use GenStage
  require Logger
  alias Concentrate.Merge.Table

  @start_link_opts [:name]
  # allow sources some time to load
  @initial_timeout 5_000

  defstruct timeout: 1_000,
            timer: nil,
            table: Table.new(),
            demand: %{}

  def start_link(opts \\ []) do
    start_link_opts = Keyword.take(opts, @start_link_opts)
    opts = Keyword.drop(opts, @start_link_opts)
    GenStage.start_link(__MODULE__, opts, start_link_opts)
  end

  @impl GenStage
  def init(opts) do
    state = %__MODULE__{}

    state =
      case Keyword.fetch(opts, :timeout) do
        {:ok, timeout} -> %{state | timeout: timeout}
        _ -> state
      end

    initial_timeout = Keyword.get(opts, :initial_timeout, @initial_timeout)
    opts = Keyword.take(opts, [:subscribe_to, :dispatcher])
    opts = Keyword.put_new(opts, :dispatcher, GenStage.BroadcastDispatcher)
    state = %{state | timer: Process.send_after(self(), :timeout, initial_timeout)}
    {:producer_consumer, state, opts}
  end

  @impl GenStage
  def handle_subscribe(:producer, _options, from, state) do
    state = %{state | table: Table.add(state.table, from), demand: Map.put(state.demand, from, 1)}
    :ok = GenStage.ask(from, 1)
    {:manual, state}
  end

  def handle_subscribe(_, _, _, state) do
    {:automatic, state}
  end

  @impl GenStage
  def handle_cancel(_reason, from, state) do
    state = %{
      state
      | table: Table.remove(state.table, from),
        demand: Map.delete(state.demand, from)
    }

    {:noreply, [], state}
  end

  @impl GenStage
  def handle_events(events, from, state) do
    latest_data = List.last(events)

    state = %{
      state
      | table: Table.update(state.table, from, latest_data),
        demand: Map.update!(state.demand, from, fn demand -> demand - length(events) end)
    }

    state =
      if state.timer do
        state
      else
        %{state | timer: Process.send_after(self(), :timeout, state.timeout)}
      end

    {:noreply, [], state}
  end

  @impl GenStage
  def handle_info(:timeout, state) do
    {time, merged} = :timer.tc(&Table.items/1, [state.table])

    _ =
      Logger.debug(fn ->
        "#{__MODULE__} merge time=#{time / 1_000}"
      end)

    state = %{state | timer: nil, demand: ask_demand(state.demand)}
    {:noreply, [merged], state}
  end

  def handle_info(msg, state) do
    _ =
      Logger.warn(fn ->
        "unknown message to #{__MODULE__} #{inspect(self())}: #{inspect(msg)}"
      end)

    {:noreply, [], state}
  end

  defp ask_demand(demand_map) do
    for {from, demand} <- demand_map, into: %{} do
      if demand == 0 do
        GenStage.ask(from, 1)
        {from, 1}
      else
        {from, demand}
      end
    end
  end
end
