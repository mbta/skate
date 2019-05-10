defmodule Concentrate.Supervisor.Pipeline do
  @moduledoc """
  Supervisor for the Concentrate pipeline.

  Children:
  * one per file we're fetching
  * one to merge multiple files into a single output stream
  * one per file to build output files
  * one supervisor sink to save files
  """
  import Supervisor, only: [child_spec: 2]

  def start_link(config) do
    Supervisor.start_link(children(config), strategy: :rest_for_one)
  end

  def children(config) do
    {source_names, source_children} = sources(config[:sources])
    {output_names, output_children} = encoders(config[:encoders])
    file_tap = [{Concentrate.Producer.FileTap, config[:file_tap]}]
    merge_filter = merge(source_names, config)
    reporters = reporters(config[:reporters])
    sinks = sinks(config[:sinks], [Concentrate.Producer.FileTap] ++ output_names)
    Enum.concat([source_children, file_tap, merge_filter, output_children, reporters, sinks])
  end

  def sources(config) do
    realtime_children = source_children(config, :gtfs_realtime, Concentrate.Parser.GTFSRealtime)

    enhanced_children =
      source_children(config, :gtfs_realtime_enhanced, Concentrate.Parser.GTFSRealtimeEnhanced)

    children = realtime_children ++ enhanced_children

    {child_ids(children), children}
  end

  defp source_children(config, key, parser) do
    for {source, url} <- Keyword.get(config, key, []) do
      {url, opts, parser} =
        case url do
          {url, opts} when is_binary(url) ->
            {url, opts,
             {parser,
              Keyword.take(
                opts,
                ~w(routes excluded_routes max_future_time headers fetch_after drop_fields)a
              )}}

          url when is_binary(url) ->
            {url, [], parser}
        end

      child_spec(
        {
          Concentrate.Producer.HTTP,
          {url, [name: source, parser: parser] ++ opts}
        },
        id: source
      )
    end
  end

  def merge(source_names, config) do
    sources = outputs_with_options(source_names, max_demand: 1)

    [
      {
        Concentrate.MergeFilter,
        name: :merge_filter,
        subscribe_to: sources,
        buffer_size: 1,
        filters: Keyword.get(config, :filters, []),
        group_filters: Keyword.get(config, :group_filters, [])
      }
    ]
  end

  def reporters(reporter_modules) when is_list(reporter_modules) do
    for module <- reporter_modules do
      child_spec(
        {Concentrate.Reporter.Consumer,
         module: module, subscribe_to: [merge_filter: [max_demand: 1]]},
        id: module
      )
    end
  end

  def encoders(config) do
    children =
      for {filename, encoder} <- config[:files] do
        child_spec(
          {
            Concentrate.Encoder.ProducerConsumer,
            name: encoder,
            files: [{filename, encoder}],
            subscribe_to: [merge_filter: [max_demand: 1]],
            buffer_size: 1
          },
          id: encoder
        )
      end

    {child_ids(children), children}
  end

  def sinks(config, output_names) do
    opts = [subscribe_to: output_names]

    for {sink_type, sink_config} <- config do
      child_module = sink_child(sink_type)
      child_opts = opts ++ sink_config

      {Concentrate.Sink.ConsumerSupervisor, {child_module, child_opts}}
    end
  end

  defp sink_child(:filesystem), do: Concentrate.Sink.Filesystem
  defp sink_child(:s3), do: Concentrate.Sink.S3

  defp child_ids(children) do
    for child <- children, do: child.id
  end

  def outputs_with_options(outputs, options) do
    for name <- outputs do
      {name, options}
    end
  end
end
