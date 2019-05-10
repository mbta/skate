defmodule Concentrate.Filter.GTFS.Stops do
  @moduledoc """
  Server which maintains a list of stop id -> parent station ID.
  """
  use GenStage
  require Logger
  import :binary, only: [copy: 1]
  @table __MODULE__

  def start_link(opts) do
    GenStage.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc "Returns the parent station ID for a stop"
  def parent_station_id(stop_id) when is_binary(stop_id) do
    hd(:ets.lookup_element(@table, stop_id, 2))
  rescue
    ArgumentError -> stop_id
  end

  @doc !"Test hook to add a child/parent mapping"
  def _insert_mapping(child_id, parent_id) when is_binary(child_id) and is_binary(parent_id) do
    true = :ets.insert(@table, {child_id, parent_id})
    :ok
  end

  def init(opts) do
    :ets.new(@table, [:named_table, :public, :duplicate_bag])
    {:consumer, %{}, opts}
  end

  def handle_events(events, _from, state) do
    inserts =
      for event <- events,
          {"stops.txt", trip_body} <- event,
          lines = String.split(trip_body, "\n"),
          {:ok, row} <- CSV.decode(lines, headers: true),
          parent_station_id = row["parent_station"],
          parent_station_id != "" do
        {copy(row["stop_id"]), copy(parent_station_id)}
      end

    _ =
      if inserts == [] do
        :ok
      else
        true = :ets.delete_all_objects(@table)
        true = :ets.insert(@table, inserts)

        Logger.info(fn ->
          "#{__MODULE__}: updated with #{length(inserts)} records"
        end)
      end

    {:noreply, [], state, :hibernate}
  end
end
