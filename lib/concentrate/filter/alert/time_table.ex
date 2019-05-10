defmodule Concentrate.Filter.Alert.TimeTable do
  @moduledoc """
  Wrapper for an ETS table which maintains a mapping of keys to values at particular times.
  """
  @epoch_seconds :calendar.datetime_to_gregorian_seconds({{1970, 1, 1}, {0, 0, 0}})
  @one_day_minus_one 86_399

  @doc "Creates a new TimeTable with the given name"
  def new(name) when is_atom(name) do
    :ets.new(name, [:named_table, :public, :bag])
  end

  @doc "Inserts the given 4-tuples into the table"
  def update(name, [{_, _, _, _} | _] = records) when is_atom(name) do
    :ets.delete_all_objects(name)
    :ets.insert(name, records)
  end

  def update(name, []) do
    :ets.delete_all_objects(name)
  end

  @doc "Queries the table for matching keys that overlap the date/timestamp."
  def date_overlaps(name, key, date_or_timestamp) do
    {start, stop} = start_stop_times(date_or_timestamp)
    selector = selector(key, start, stop)

    :ets.select(name, [selector])
  rescue
    ArgumentError -> []
  end

  @doc "Queries the table and returns true if there are any matches."
  def date_overlaps?(name, key, date_or_timestamp) do
    {start, stop} = start_stop_times(date_or_timestamp)
    selector = selector(key, start, stop)
    :ets.select(name, [selector], 1) != :"$end_of_table"
  rescue
    ArgumentError -> false
  end

  defp start_stop_times(timestamp) when is_integer(timestamp) do
    {timestamp, timestamp}
  end

  defp start_stop_times({_, _, _} = date) do
    start = :calendar.datetime_to_gregorian_seconds({date, {0, 0, 0}}) - @epoch_seconds
    stop = start + @one_day_minus_one
    {start, stop}
  end

  defp start_stop_times({start_timestamp, stop_timestamp} = times)
       when is_integer(start_timestamp) and is_integer(stop_timestamp) do
    times
  end

  defp selector(key, start_timestamp, stop_timestamp) do
    {
      {key, :"$1", :"$2", :"$3"},
      [
        # DateTime is between the start/end dates
        {:"=<", :"$1", stop_timestamp},
        {:"=<", start_timestamp, :"$2"}
      ],
      [:"$3"]
    }
  end
end
