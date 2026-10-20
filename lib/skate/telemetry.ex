defmodule Skate.Telemetry do
  @moduledoc """
  Telemetry listeners for Skate business logic.
  """
  require Logger

  @oban_handler_id "skate.oban"

  def setup_telemetry do
    :telemetry.detach(@oban_handler_id)

    :telemetry.attach(@oban_handler_id, [:skate, :repo, :query], &repo_query_telemetry/4, %{})

    attach_oban_handler()
  end

  def attach_oban_handler(id \\ @oban_handler_id, config \\ []) do
    events =
      for event <- [:start, :stop, :exception] do
        [:oban, :job, event]
      end

    :telemetry.detach(id)
    :telemetry.attach_many(id, events, &handle_oban_job_event/4, config)
  end

  def handle_oban_job_event([:oban, :job, :start], _measurements, metadata, _config) do
    worker = metadata[:worker] || "unknown"
    queue = metadata[:queue] || "unknown"
    attempt = metadata[:attempt] || 0
    job_id = metadata[:id] || "unknown"
    args = metadata[:args] || %{}
    detour_id = metadata[:detour_id] || "unknown"

    Logger.notice(fn ->
      "oban job start: worker=#{worker} queue=#{queue} job_id=#{inspect(job_id)} attempt=#{attempt} detour_id=#{inspect(detour_id)} args=#{inspect(args)}"
    end)
  end

  def handle_oban_job_event([:oban, :job, :stop], measurements, metadata, _config) do
    worker = metadata[:worker] || "unknown"
    queue = metadata[:queue] || "unknown"
    attempt = metadata[:attempt] || 0
    job_id = metadata[:id] || "unknown"
    args = metadata[:args] || %{}
    result = metadata[:result] || :unknown
    duration_ms = System.convert_time_unit(measurements[:duration], :native, :millisecond)
    detour_id = metadata[:detour_id] || "unknown"

    Logger.notice(fn ->
      "oban job stop: worker=#{worker} queue=#{queue} job_id=#{inspect(job_id)} attempt=#{attempt} duration_ms=#{duration_ms} detour_id=#{inspect(detour_id)} result=#{inspect(result)} args=#{inspect(args)}"
    end)
  end

  def handle_oban_job_event([:oban, :job, :exception], measurements, metadata, _config) do
    worker = metadata[:worker] || "unknown"
    queue = metadata[:queue] || "unknown"
    attempt = metadata[:attempt] || 0
    job_id = metadata[:id] || "unknown"
    args = metadata[:args] || %{}
    duration_ms = System.convert_time_unit(measurements[:duration], :native, :millisecond)
    reason = metadata[:reason] || :unknown
    detour_id = metadata[:detour_id] || "unknown"

    Logger.error(fn ->
      "oban job exception: worker=#{worker} queue=#{queue} job_id=#{inspect(job_id)} attempt=#{attempt} duration_ms=#{duration_ms} detour_id=#{inspect(detour_id)} reason=#{inspect(reason)} args=#{inspect(args)}"
    end)
  end

  def handle_oban_job_event(_event, _measurements, _metadata, _config), do: nil

  def repo_query_telemetry(
        [:skate, :repo, :query],
        %{decode_time: decode_time, query_time: query_time, total_time: total_time},
        %{
          source: source,
          result: {:ok, %{connection_id: connection_id, num_rows: num_rows}},
          query: query
        },
        _config
      )
      when source in ["detours"] do
    Logger.info(fn ->
      "Telemetry for db query, source=#{source} connection_id=#{connection_id} num_rows=#{num_rows} decode_time=#{decode_time} query_time=#{query_time} total_time=#{total_time} query='#{query}'"
    end)
  end

  def repo_query_telemetry(_event, _measurements, _metadata, _config), do: nil
end
