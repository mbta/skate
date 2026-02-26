defmodule Concentrate.Pipeline.VehiclePositionsPipeline do
  @moduledoc false

  @behaviour Concentrate.Pipeline
  alias Concentrate.Pipeline

  @type opts :: [
          busloc_url: String.t(),
          busloc_topic: String.t(),
          broker_configs: [EmqttFailover.Config.t()],
          swiftly_authorization_key: String.t(),
          swiftly_realtime_vehicles_url: String.t()
        ]

  @impl Pipeline
  def init(opts) do
    {source_names, source_children} = sources(opts)

    merge = merge(source_names)

    consumers = consumers()

    Enum.concat([source_children, merge, consumers])
  end

  def sources(opts) do
    realtime_enhanced_child =
      cond do
        opts[:busloc_topic] && opts[:broker_configs] ->
          Pipeline.mqtt_source(
            :gtfs_realtime_enhanced,
            Concentrate.Parser.GTFSRealtimeEnhanced,
            topics: [opts[:busloc_topic]],
            broker_configs: opts[:broker_configs]
          )

        opts[:busloc_url] ->
          Pipeline.source(
            :gtfs_realtime_enhanced,
            opts[:busloc_url],
            Concentrate.Parser.GTFSRealtimeEnhanced
          )

        true ->
          nil
      end

    swiftly_child =
      if opts[:swiftly_realtime_vehicles_url] && opts[:swiftly_authorization_key] do
        Pipeline.source(
          :swiftly_realtime_vehicles,
          opts[:swiftly_realtime_vehicles_url],
          Concentrate.Parser.SwiftlyRealtimeVehicles,
          headers: %{
            "Authorization" => opts[:swiftly_authorization_key]
          },
          get_opts: [
            params: %{
              unassigned: "true",
              verbose: "true"
            }
          ]
        )
      else
        nil
      end

    children = Enum.reject([realtime_enhanced_child, swiftly_child], &is_nil/1)

    {child_ids(children), children}
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
    vehicle_positions_consumer = Pipeline.consumer(Concentrate.Consumer.VehiclePositions, :merge)

    [vehicle_positions_consumer]
  end

  defp child_ids(children) do
    for child <- children, do: child.id
  end

  defp outputs_with_options(outputs, options) do
    for name <- outputs do
      {name, options}
    end
  end
end
