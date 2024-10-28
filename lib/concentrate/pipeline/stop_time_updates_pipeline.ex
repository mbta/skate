defmodule Concentrate.Pipeline.StopTimeUpdatesPipeline do
  @moduledoc false

  @behaviour Concentrate.Pipeline
  alias Concentrate.Pipeline

  @type opts :: [
          trip_updates_url: String.t()
        ]

  @impl Pipeline
  def init(opts) do
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
    Pipeline.consumer(Concentrate.Consumer.StopTimeUpdates, :trip_updates_enhanced)
  end
end
