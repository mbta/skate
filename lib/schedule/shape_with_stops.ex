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

  defimpl Jason.Encoder do
    def encode(shape_with_stops, opts) do
      stops_to_encode =
        shape_with_stops
        |> Map.get(:stops, [])
        |> Enum.map(
          &%{
            id: &1.id,
            name: &1.name,
            lat: &1.latitude,
            lon: &1.longitude,
            connections: &1.connections
          }
        )

      Jason.Encode.map(
        %{id: shape_with_stops.id, points: shape_with_stops.points, stops: stops_to_encode},
        opts
      )
    end
  end

  defstruct [
    :id,
    points: [],
    stops: []
  ]

  @spec create(Shape.t(), [Stop.t()]) :: t()
  def create(shape, stops) do
    %__MODULE__{id: shape.id, points: shape.points, stops: stops}
  end
end
