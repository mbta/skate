defmodule TrainVehicles.TrainVehicle do
  @type t :: %__MODULE__{
          id: String.t(),
          route_id: String.t() | nil,
          direction_id: 0 | 1,
          latitude: float,
          longitude: float,
          bearing: non_neg_integer
        }

  @derive Jason.Encoder

  defstruct [
    :id,
    :route_id,
    :direction_id,
    :latitude,
    :longitude,
    bearing: 0
  ]
end
