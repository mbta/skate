defmodule Concentrate.Supervisor do
  @moduledoc """
  Supervisor for Concentrate.

  Children:
  * one for the pipeline
  """

  @type opts :: [
          busloc_url: String.t(),
          swiftly_authorization_key: String.t(),
          swiftly_realtime_vehicles_url: String.t()
        ]

  @spec start_link(opts()) :: Supervisor.on_start()
  def start_link(opts) do
    Supervisor.start_link(pipeline(opts), strategy: :rest_for_one)
  end

  def pipeline(opts) do
    [
      %{
        id: Concentrate.Supervisor.Pipeline,
        start: {Concentrate.Supervisor.Pipeline, :start_link, [opts]}
      }
    ]
  end
end
