defmodule Concentrate.Pipeline.StopTimeUpdatesPipeline do
  alias Concentrate.Pipeline

  @type opts :: [
          trip_updates_url: String.t()
        ]

  @spec pipeline(opts()) :: list()
  def pipeline(opts) do
    Enum.concat([sources(opts), consumers()])
  end

  def sources(opts) do
    trip_updates_child =
      if opts[:trip_updates_url] do
        Pipeline.source(
          :trip_updates_enhanced,
          opts[:trip_updates_url],
          Concentrate.Parser.GTFSRealtimeEnhanced
        )
      else
        nil
      end

    [trip_updates_child]
    |> Enum.reject(&is_nil/1)
  end

  def consumers do
    stop_time_updates_consumer =
      Pipeline.consumer(Concentrate.Consumer.StopTimeUpdates, :stop_time_updates)

    [stop_time_updates_consumer]
  end
end
