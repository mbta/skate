defmodule TrainVehicles.Stream do
  @moduledoc """
  Uses Api.Stream to subscribe to the Api and receive events.
  """

  use GenStage
  alias Phoenix.PubSub
  alias TrainVehicles.{Parser, TrainVehicle}
  require Logger

  @type event_type :: :reset | :add | :update | :remove

  @subway_routes [
    "Blue",
    "Green-B",
    "Green-C",
    "Green-D",
    "Green-E",
    "Orange",
    "Red",
    "Mattapan"
  ]

  def start_link(opts) do
    {name, opts} = Keyword.pop(opts, :name, __MODULE__)

    GenStage.start_link(
      __MODULE__,
      opts,
      name: name
    )
  end

  def init(opts) do
    producer_consumer = Keyword.fetch!(opts, :subscribe_to)
    broadcast_fn = Keyword.get(opts, :broadcast_fn, &PubSub.broadcast/3)
    {:consumer, %{broadcast_fn: broadcast_fn}, subscribe_to: [producer_consumer]}
  end

  def handle_events(events, _from, state) do
    :ok = Enum.each(events, &send_event(&1, state.broadcast_fn))
    {:noreply, [], state}
  end

  defp send_event(
         %Api.Stream.Event{
           event: :remove,
           data: %JsonApi{data: data}
         },
         broadcast_fn
       ) do
    data
    |> Enum.map(& &1.id)
    |> broadcast(:remove, broadcast_fn)
  end

  defp send_event(
         %Api.Stream.Event{
           event: type,
           data: %JsonApi{data: data}
         },
         broadcast_fn
       ) do
    data
    |> Enum.map(&Parser.parse/1)
    |> Enum.filter(&Enum.member?(@subway_routes, &1.route_id))
    |> broadcast(type, broadcast_fn)
  end

  @typep broadcast_fn :: (atom, String.t(), any -> :ok | {:error, any})
  @spec broadcast([TrainVehicle.t() | String.t()], event_type, broadcast_fn) :: :ok
  defp broadcast([], _type, _broadcast_fn), do: :ok

  defp broadcast(data, type, broadcast_fn) do
    TrainVehicles.PubSub
    |> broadcast_fn.("train_vehicles", {type, data})
    |> log_errors()
  end

  @spec log_errors(:ok | {:error, any}) :: :ok
  defp log_errors(:ok) do
    :ok
  end

  defp log_errors({:error, error}) do
    Logger.error("error=#{inspect(error)}")
  end
end
