defmodule Concentrate.Pipeline.VehiclePositionsPipeline do
  @type opts :: [
          busloc_url: String.t(),
          swiftly_authorization_key: String.t(),
          swiftly_realtime_vehicles_url: String.t(),
          trip_updates_url: String.t()
        ]

  @spec pipeline(opts()) :: list()
  def pipeline(opts) do
    {source_names, source_children} = sources(opts)

    merge = merge(source_names)

    consumers = consumers()

    Enum.concat([source_children, merge, consumers])
  end

  def sources(opts) do
    realtime_enhanced_child =
      if opts[:busloc_url] do
        source_child(
          :gtfs_realtime_enhanced,
          opts[:busloc_url],
          Concentrate.Parser.GTFSRealtimeEnhanced
        )
      else
        nil
      end

    swiftly_child =
      if opts[:swiftly_realtime_vehicles_url] && opts[:swiftly_authorization_key] do
        source_child(
          :swiftly_realtime_vehicles,
          opts[:swiftly_realtime_vehicles_url],
          Concentrate.Parser.SwiftlyRealtimeVehicles,
          headers: %{
            "Authorization" => opts[:swiftly_authorization_key]
          },
          params: %{
            unassigned: "true",
            verbose: "true"
          }
        )
      else
        nil
      end

    trip_updates_child =
      if opts[:trip_updates_url] do
        source_child(
          :trip_updates_enhanced,
          opts[:trip_updates_url],
          Concentrate.Parser.GTFSRealtimeEnhanced
        )
      else
        nil
      end

    children =
      [realtime_enhanced_child, swiftly_child, trip_updates_child]
      |> Enum.reject(&is_nil/1)

    {child_ids(children), children}
  end

  defp source_child(source, url, parser, opts \\ []) do
    Supervisor.child_spec(
      {
        Concentrate.Producer.HTTP,
        {url, [name: source, parser: parser] ++ opts}
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

    stop_time_updates_consumer =
      consumer(Concentrate.Consumer.StopTimeUpdates, :stop_time_updates)

    [vehicle_positions_consumer, stop_time_updates_consumer]
  end

  def consumer(module, id) do
    Supervisor.child_spec(
      {module, subscribe_to: [merge: [max_demand: 1]]},
      id: id
    )
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
