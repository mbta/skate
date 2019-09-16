defmodule Gtfs.Shape do
  alias Gtfs.ShapePoint

  @type id :: String.t()

  @type t :: %__MODULE__{
          id: id(),
          points: [ShapePoint.t()]
        }

  @enforce_keys [
    :id,
    :points
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    points: []
  ]
end
