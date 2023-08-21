defmodule Schedule.ShapeWithStops do
  @moduledoc """
  The shape of a route pattern with all associated stops
  """
  alias Schedule.Gtfs.{Shape, Stop}

  @type id :: String.t()

  @type t :: %__MODULE__{
          id: id(),
          points: [Shape.Point.t()],
          stops: [Stop.t()]
        }

  @enforce_keys [
    :id,
    :points,
    :stops
  ]

  @derive Jason.Encoder
  defstruct [
    :id,
    points: [],
    stops: []
  ]

  @spec create(Shape.t(), [Stop.t()]) :: t()
  def create(shape, stops) do
    %__MODULE__{id: shape.id, points: shape.points, stops: Enum.map(stops, fn stop -> stop
  |> Map.from_struct()
|> Map.put(:route_ids, ["1", "2", "3"])
end)}
  end
end
