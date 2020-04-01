defmodule TrainVehicles.Supervisor do
  use Supervisor

  @api_params [
    "fields[vehicle]": "latitude,longitude,bearing"
  ]

  def start_link(_opts) do
    Supervisor.start_link(__MODULE__, :ok)
  end

  @impl true
  def init(:ok) do
    children()
    |> Supervisor.init(strategy: :one_for_all)
  end

  defp children() do
    [
      supervisor(Phoenix.PubSub.PG2, [TrainVehicles.PubSub, []])
      | stream_children()
    ]
  end

  defp stream_children() do
    sses_opts =
      Api.Stream.build_options(
        name: TrainVehicles.Api.SSES,
        path: "/vehicles",
        params: @api_params
      )

    [
      {ServerSentEventStage, sses_opts},
      {Api.Stream, name: TrainVehicles.Api, subscribe_to: TrainVehicles.Api.SSES},
      {TrainVehicles.Stream, subscribe_to: TrainVehicles.Api}
    ]
  end
end
