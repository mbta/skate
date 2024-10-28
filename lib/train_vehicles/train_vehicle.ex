defmodule TrainVehicles.TrainVehicle do
  @moduledoc false

  @type id :: String.t()

  @type t :: %__MODULE__{
          id: id(),
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
