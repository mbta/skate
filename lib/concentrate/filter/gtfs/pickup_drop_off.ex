defmodule Concentrate.Filter.GTFS.PickupDropOff do
  @moduledoc """
  Server which knows whether riders can be picked up or dropped off at a stop.
  """
  use GenStage
  require Logger
  import :binary, only: [copy: 1]
  @table __MODULE__

  def start_link(opts) do
    GenStage.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @spec pickup_drop_off(String.t(), String.t() | non_neg_integer) :: {boolean, boolean} | :unknown
  def pickup_drop_off(trip_id, stop_or_stop_sequence) when is_binary(trip_id) do
    find_value({trip_id, stop_or_stop_sequence})
  end

  defp find_value(key) do
    case :ets.lookup(@table, key) do
      [{_, value}] -> value
      [] -> :unknown
    end
  rescue
    ArgumentError -> :unknown
  end

  @impl GenStage
  def init(opts) do
    :ets.new(@table, [:named_table, :public, :set])
    {:consumer, [], opts}
  end

  @impl GenStage
  def handle_events(events, _from, state) do
    count =
      events
      |> List.flatten()
      |> Stream.flat_map(fn
        {"stop_times.txt", body} ->
          io_stream(body)

        _ ->
          []
      end)
      |> CSV.decode(headers: true, num_workers: System.schedulers())
      |> Stream.flat_map(&build_inserts/1)
      |> Enum.reduce(0, fn insert, acc ->
        if acc == 0 do
          true = :ets.delete_all_objects(@table)
        end

        :ets.insert(@table, insert)
        acc + 1
      end)

    if count > 0 do
      Logger.info(fn ->
        "#{__MODULE__}: updated with #{count} records"
      end)
    end

    {:noreply, [], state, :hibernate}
  end

  @spec io_stream(binary) :: Enumerable.t()
  defp io_stream(body) when is_binary(body) do
    # turns the given binary into a Stream of lines.
    Stream.resource(
      fn ->
        {:ok, pid} = StringIO.open(body)
        pid
      end,
      fn pid ->
        case IO.read(pid, :line) do
          line when is_binary(line) -> {[line], pid}
          _ -> {:halt, pid}
        end
      end,
      fn pid ->
        StringIO.close(pid)
      end
    )
  end

  defp can_pickup_drop_off?("1"), do: false
  defp can_pickup_drop_off?(_), do: true

  defp build_inserts({:error, _}) do
    []
  end

  defp build_inserts({:ok, row}) do
    trip_id = copy(Map.get(row, "trip_id"))
    stop_id = copy(Map.get(row, "stop_id"))
    stop_sequence = String.to_integer(Map.get(row, "stop_sequence"))

    pickup? = can_pickup_drop_off?(Map.get(row, "pickup_type"))
    drop_off? = can_pickup_drop_off?(Map.get(row, "drop_off_type"))

    for stop_key <- [stop_id, stop_sequence] do
      {{trip_id, stop_key}, {pickup?, drop_off?}}
    end
  end
end
