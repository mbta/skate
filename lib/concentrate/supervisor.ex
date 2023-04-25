defmodule Concentrate.Supervisor do
  @moduledoc """
  Supervisor for the Concentrate pipeline.
  """

  alias Concentrate.Pipeline
  alias Concentrate.Pipeline.VehiclePositionsPipeline

  @spec start_link(keyword()) :: Supervisor.on_start()
  def start_link(opts) do
    Supervisor.start_link(
      [
        {Pipeline, Keyword.merge(opts, module: VehiclePositionsPipeline)}
      ],
      strategy: :one_for_one
    )
  end

  @spec child_spec(keyword()) :: Supervisor.child_spec()
  def child_spec(opts) do
    %{
      type: :supervisor,
      id: __MODULE__,
      start: {__MODULE__, :start_link, [opts]}
    }
  end
end
