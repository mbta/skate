defmodule Concentrate.Pipeline.VehiclePositionsPipelineSupervisor do
  @moduledoc """
  Supervisor for the VehiclePositionsPipeline.
  """
  use Supervisor

  @spec start_link(keyword()) :: Supervisor.on_start()
  def start_link(opts) do
    Supervisor.start_link(__MODULE__, opts)
  end

  @impl true
  def init(opts) do
    Supervisor.init(Concentrate.Pipeline.VehiclePositionsPipeline.init(opts),
      strategy: :rest_for_one
    )
  end
end
