defmodule Concentrate.Supervisor do
  @moduledoc """
  Supervisor for Concentrate.

  Children:
  * one for the pipeline
  """

  @type opts :: [concentrate_vehicle_positions_url: String.t(), busloc_url: String.t()]

  @spec start_link(opts()) :: Supervisor.on_start()
  def start_link(opts) do
    Supervisor.start_link(children(opts), strategy: :rest_for_one)
  end

  @spec children(opts()) :: list(list(Supervisor.child_spec() | Supervisor.supervisor()))
  def children(opts) do
    pipeline = pipeline(opts)
    health = health()
    Enum.concat([pipeline, health])
  end

  def pipeline(opts) do
    [
      %{
        id: Concentrate.Supervisor.Pipeline,
        start: {Concentrate.Supervisor.Pipeline, :start_link, [opts]}
      }
    ]
  end

  def health do
    [
      {Concentrate.Health, name: Concentrate.Health}
    ]
  end
end
