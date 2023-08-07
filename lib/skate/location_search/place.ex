defmodule Skate.LocationSearch.Place do
  @type t :: %__MODULE__{
          id: String.t(),
          name: String.t() | nil,
          address: String.t(),
          latitude: float(),
          longitude: float()
        }

  @enforce_keys [
    :id,
    :address,
    :latitude,
    :longitude
  ]

  @derive {Jason.Encoder, only: [:id, :name, :address, :latitude, :longitude]}
  defstruct [
    :id,
    :name,
    :address,
    :latitude,
    :longitude
  ]
end
