defmodule Concentrate.Config do
  @moduledoc """
  Configuration parsing for Concentrate
  """

  def setup() do
    "CONCENTRATE_JSON"
    |> System.get_env()
    |> parse_json_configuration
    |> Enum.each(&update_configuration/1)
  end

  def parse_json_configuration(nil) do
    []
  end

  def parse_json_configuration(json) do
    json = Jason.decode!(json, strings: :copy)
    Enum.flat_map(json, &decode_json_key_value/1)
  end

  defp decode_json_key_value({"sources", source_object}) do
    realtime = Map.get(source_object, "gtfs_realtime", %{})
    enhanced = Map.get(source_object, "gtfs_realtime_enhanced", %{})

    [
      sources: [
        gtfs_realtime: decode_gtfs_realtime(realtime),
        gtfs_realtime_enhanced: decode_gtfs_realtime(enhanced)
      ]
    ]
  end

  defp decode_json_key_value({"alerts", object}) do
    case object do
      %{"url" => url} ->
        [alerts: [url: url]]

      _ ->
        []
    end
  end

  defp decode_json_key_value({"gtfs", %{"url" => url}}) do
    [gtfs: [url: url]]
  end

  defp decode_json_key_value({"sinks", sinks_object}) do
    sinks =
      case sinks_object do
        %{"s3" => s3_object} ->
          %{
            s3: decode_s3(s3_object)
          }

        _ ->
          %{}
      end

    [
      sinks: sinks
    ]
  end

  defp decode_json_key_value({"log_level", level_str}) do
    level =
      case level_str do
        "error" -> :error
        "warn" -> :warn
        "info" -> :info
        "debug" -> :debug
      end

    Logger.configure(level: level)
    []
  end

  defp decode_json_key_value({"file_tap", opts}) do
    if Map.get(opts, "enabled") do
      [file_tap: [enabled?: true]]
    else
      []
    end
  end

  defp decode_json_key_value(_unknown) do
    []
  end

  defp decode_gtfs_realtime(realtime) do
    # UNSAFE! only call this during startup, and with controlled JSON files.
    for {key, value} <- realtime, into: %{} do
      value = decode_gtfs_realtime_value(value)
      {String.to_atom(key), value}
    end
  end

  defp decode_gtfs_realtime_value(url) when is_binary(url) do
    url
  end

  defp decode_gtfs_realtime_value(%{"url" => url} = value) when is_binary(url) do
    opts =
      for {key, {guard, process}} <- [
            routes: {&is_list/1, & &1},
            excluded_routes: {&is_list/1, & &1},
            fallback_url: {&is_binary/1, & &1},
            max_future_time: {&is_integer/1, & &1},
            fetch_after: {&is_integer/1, & &1},
            content_warning_timeout: {&is_integer/1, & &1},
            headers: {&is_map/1, & &1},
            drop_fields: {&is_map/1, &process_drop_fields/1}
          ],
          {:ok, opt_value} <- [Map.fetch(value, Atom.to_string(key))],
          guard.(opt_value) do
        {key, process.(opt_value)}
      end

    if opts == [] do
      url
    else
      {url, opts}
    end
  end

  defp process_drop_fields(map) do
    for {mod_suffix, str_fields} <- map, into: %{} do
      mod = Module.concat(["Concentrate", mod_suffix])
      fields = Enum.map(str_fields, &String.to_existing_atom/1)
      {mod, fields}
    end
  end

  defp decode_s3(s3_object) do
    keys = ~w(bucket prefix)a

    Enum.reduce(keys, [], fn key, acc ->
      key_str = Atom.to_string(key)

      case s3_object do
        %{^key_str => value} ->
          [{key, value} | acc]

        _ ->
          acc
      end
    end)
  end

  defp update_configuration({key, value}) do
    Application.put_env(:skate, key, value)
  end
end
