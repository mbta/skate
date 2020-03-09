defmodule Concentrate.Supervisor do
  @moduledoc """
  Supervisor for the Concentrate pipeline.
  """
  use Supervisor

  @spec start_link(keyword()) :: Supervisor.on_start()
  def start_link(opts) do
    Supervisor.start_link(__MODULE__, opts)
  end

  @impl true
  def init(opts) do
    Supervisor.init(children(opts), strategy: :one_for_one)
  end

  def children(opts) do
    [
      {Concentrate.Pipeline.VehiclePositionsPipelineSupervisor, opts},
      {Concentrate.Pipeline.StopTimeUpdatesPipelineSupervisor, opts}
    ]
  end
end
