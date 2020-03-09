defmodule Concentrate.Pipeline.StopTimeUpdatesPipeline do
  @behaviour Concentrate.Pipeline
  alias Concentrate.PipelineHelpers

  @type opts :: [
          trip_updates_url: String.t()
        ]

  @impl Concentrate.Pipeline
  @spec init(opts()) :: [Supervisor.child_spec()]
  def init(opts) do
    [source(opts), consumer()]
  end

  def source(opts) do
    PipelineHelpers.source(
      :trip_updates_enhanced,
      opts[:trip_updates_url],
      Concentrate.Parser.GTFSRealtimeEnhanced
    )
  end

  def consumer() do
    PipelineHelpers.consumer(
      Concentrate.Consumer.StopTimeUpdates,
      :stop_time_updates,
      :trip_updates_enhanced
    )
  end
end
