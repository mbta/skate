defmodule Concentrate.Supervisor do
  @moduledoc """
  Supervisor for the Concentrate pipeline.

  Children:
  * one per file we're fetching
  * one to merge multiple files into a single output stream
  * one for each consumer
  """
  use Supervisor

  @type opts :: [
          busloc_url: String.t(),
          swiftly_authorization_key: String.t(),
          swiftly_realtime_vehicles_url: String.t()
        ]

  @spec start_link(opts()) :: Supervisor.on_start()
  def start_link(opts) do
    Supervisor.start_link(__MODULE__, opts)
  end

  @impl true
  def init(opts) do
    Supervisor.init(children(opts), strategy: :rest_for_one)
  end

  def children(opts) do
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

    children =
      [realtime_enhanced_child, swiftly_child]
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

    [vehicle_positions_consumer]
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

  def outputs_with_options(outputs, options) do
    for name <- outputs do
      {name, options}
    end
  end
end
