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

  @spec start_link(Concentrate.Supervisor.opts()) :: Supervisor.on_start()
  def start_link(opts) do
    Supervisor.start_link(children(opts), strategy: :rest_for_one)
  end

  def children(opts) do
    {source_names, source_children} = sources(opts)

    merge = merge(source_names)

    consumers = consumers()

    Enum.concat([source_children, merge, consumers])
    # Enum.concat([source_children, merge])
  end

  def sources(opts) do
    realtime_child =
      if opts[:concentrate_vehicle_positions_url] do
        source_child(
          :gtfs_realtime,
          opts[:concentrate_vehicle_positions_url],
          Concentrate.Parser.GTFSRealtime
        )
      else
        nil
      end

    enhanced_child =
      if opts[:busloc_url] do
        source_child(
          :gtfs_realtime_enhanced,
          opts[:busloc_url],
          Concentrate.Parser.GTFSRealtimeEnhanced
        )
      else
        nil
      end

    children =
      [realtime_child, enhanced_child]
      |> Enum.reject(&is_nil/1)

    {child_ids(children), children}
  end

  defp source_child(_source, nil, _parser), do: nil

  defp source_child(source, url, parser) do
    child_spec(
      {
        Concentrate.Producer.HTTP,
        {url, [name: source, parser: parser]}
      },
      id: source
    )
  end

  def merge(source_names) do
    sources = outputs_with_options(source_names, max_demand: 1)

    [
      {
        Concentrate.Merge,
        name: :merge, subscribe_to: sources, buffer_size: 1
      }
    ]
  end

  def consumers do
    vehicle_positions_consumer =
      consumer(Concentrate.Consumer.VehiclePositions, :vehicle_positions)

    [vehicle_positions_consumer]
  end

  def consumer(module, id) do
    child_spec(
      {module, subscribe_to: [merge: [max_demand: 1]]},
      id: id
    )
  end

  defp child_ids(children) do
    for child <- children, do: child.id
  end

  def outputs_with_options(outputs, options) do
    for name <- outputs do
      {name, options}
    end
  end
end
