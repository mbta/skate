defmodule Concentrate.Pipeline.StopTimeUpdatesPipeline do
  alias Concentrate.Pipeline

  @type opts :: [
          trip_updates_url: String.t()
        ]

  @spec pipeline(opts()) :: list()
  def pipeline(opts) do
    [source(opts), consumer()]
  end

  def source(opts) do
    Pipeline.source(
      :trip_updates_enhanced,
      opts[:trip_updates_url],
      Concentrate.Parser.GTFSRealtimeEnhanced
    )
  end

  def consumer() do
    Pipeline.consumer(
      Concentrate.Consumer.StopTimeUpdates,
      :stop_time_updates,
      :trip_updates_enhanced
    )
  end
end
