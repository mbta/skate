defmodule Skate.Telemetry do
  @moduledoc """
  Telemetry listeners for Skate business logic.
  """
  require Logger

  def setup_telemetry do
    :telemetry.attach(
      "skate",
      [:skate, :repo, :query],
      &Skate.Telemetry.repo_query_telemetry/4,
      %{}
    )
  end

  def repo_query_telemetry(
        [:skate, :repo, :query],
        %{decode_time: decode_time, query_time: query_time, total_time: total_time} = m,
        %{
          source: source,
          result: {:ok, %{connection_id: connection_id, num_rows: num_rows}},
          query: query
        },
        _config
      )
      when source in ["detours"] do
        dbg(m)
        IO.puts(System.convert_time_unit(total_time, :native, :millisecond))
    Logger.info(fn ->
      "Telemetry for db query, source=#{source} connection_id=#{connection_id} num_rows=#{num_rows} decode_time=#{decode_time} query_time=#{query_time} total_time=#{total_time} query='#{query}'"
    end)
  end

  def repo_query_telemetry(_event, _measurements, _metadata, _config), do: nil
end
