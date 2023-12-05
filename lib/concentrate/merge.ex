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
  alias Concentrate.{StopTimeUpdate, TripUpdate, VehiclePosition}
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

    {time, grouped} = :timer.tc(&group/1, [merged])

    _ =
      Logger.debug(fn ->
        "#{__MODULE__} group time=#{time / 1_000}"
      end)

    state = %{state | timer: nil, demand: ask_demand(state.demand)}
    {:noreply, [grouped], state}
  end

  def handle_info(msg, state) do
    _ =
      Logger.warning(fn ->
        "unknown message to #{__MODULE__} #{inspect(self())}: #{inspect(msg)}"
      end)

    {:noreply, [], state}
  end

  @type trip_group :: {TripUpdate.t() | nil, [VehiclePosition.t()], [StopTimeUpdate.t()]}

  @doc """
  Given a list of parsed data, returns a list of tuples:

  {TripUpdate.t() | nil, [VehiclePosition.t()], [StopTimeUpdate.t]}

  The VehiclePositions/StopTimeUpdates will share the same trip ID.
  """
  @spec group([TripUpdate.t() | VehiclePosition.t() | StopTimeUpdate.t()]) :: [trip_group]
  def group(parsed) do
    # we sort by the initial size, which keeps the trip updates in their original ordering
    parsed
    |> Enum.reduce(%{}, &group_by_trip_id/2)
    |> Map.values()
    |> Enum.flat_map(fn
      {%TripUpdate{} = tu, [], []} ->
        if TripUpdate.schedule_relationship(tu) == :CANCELED do
          [{tu, [], []}]
        else
          []
        end

      {tu, vps, stus} ->
        stus = Enum.sort_by(stus, &StopTimeUpdate.stop_sequence/1)
        [{tu, vps, stus}]
    end)
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

  defp group_by_trip_id(%TripUpdate{} = tu, map) do
    if trip_id = TripUpdate.trip_id(tu) do
      Map.update(map, trip_id, {tu, [], []}, &add_trip_update(&1, tu))
    else
      map
    end
  end

  defp group_by_trip_id(%VehiclePosition{} = vp, map) do
    trip_id = VehiclePosition.trip_id(vp)

    Map.update(map, trip_id, {nil, [vp], []}, &add_vehicle_position(&1, vp))
  end

  defp group_by_trip_id(%StopTimeUpdate{} = stu, map) do
    trip_id = StopTimeUpdate.trip_id(stu)

    Map.update(map, trip_id, {nil, [], [stu]}, &add_stop_time_update(&1, stu))
  end

  defp add_trip_update({_tu, vps, stus}, tu) do
    {tu, vps, stus}
  end

  defp add_vehicle_position({tu, vps, stus}, vp) do
    {tu, [vp | vps], stus}
  end

  defp add_stop_time_update({tu, vps, stus}, stu) do
    {tu, vps, [stu | stus]}
  end
end
