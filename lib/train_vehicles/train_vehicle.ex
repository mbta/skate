defmodule TrainVehicles.TrainVehicle do
  @type t :: %__MODULE__{
          id: String.t(),
          route_id: String.t() | nil,
          latitude: float,
          longitude: float,
          bearing: non_neg_integer
        }

  @derive Jason.Encoder

  defstruct [
    :id,
    :route_id,
    :latitude,
    :longitude,
    bearing: 0
  ]
end
