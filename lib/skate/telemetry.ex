defmodule Skate.Telemetry do
  @moduledoc """
  Telemetry listeners for Skate business logic.
  """
  require Logger

  def setup_telemetry do
    _ =
      :telemetry.attach(
        "skate",
        [:skate, :repo, :query],
        &Skate.Telemetry.handle_event/4,
        %{}
      )
  end

  def handle_event(
        [:skate, :repo, :query],
        %{decode_time: decode_time, query_time: query_time, total_time: total_time},
        %{
          source: "detours",
          result: {:ok, %{connection_id: connection_id, num_rows: num_rows}},
          query: query
        },
        _config
      ) do
    Logger.info(fn ->
      "Telemetry for Detours query, connection_id=#{connection_id} num_rows=#{num_rows} decode_time=#{decode_time} query_time=#{query_time} total_time=#{total_time} query='#{query}'"
    end)
  end

  def handle_event(_event, _measurements, _metadata, _config), do: nil
end
