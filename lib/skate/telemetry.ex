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

  def handle_event([:skate, :repo, :query], measurements, metadata, _config) do
    if metadata.source == "detours" do
      {:ok, result} = metadata.result

      Logger.info(fn ->
        "Telemetry for Detours query, connection_id=#{result.connection_id} num_rows=#{result.num_rows} decode_time=#{measurements.decode_time} query_time=#{measurements.query_time} total_time=#{measurements.total_time} query=#{metadata.query}"
      end)
    end
  end
end
