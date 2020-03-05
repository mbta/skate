defmodule Concentrate.Supervisor do
  @moduledoc """
  Supervisor for the Concentrate pipeline.

  Children:
  * one per file we're fetching
  * one to merge multiple files into a single output stream
  * one for each consumer
  """
  use Supervisor

  @spec start_link(keyword()) :: Supervisor.on_start()
  def start_link(opts) do
    Supervisor.start_link(__MODULE__, opts)
  end

  @impl true
  def init(opts) do
    Supervisor.init(children(opts), strategy: :rest_for_one)
  end

  def children(opts) do
    Enum.concat([
      Concentrate.Pipeline.VehiclePositionsPipeline.pipeline(opts),
      Concentrate.Pipeline.StopTimeUpdatesPipeline.pipeline(opts)
    ])
  end
end
