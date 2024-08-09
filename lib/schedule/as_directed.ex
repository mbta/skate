defmodule Schedule.AsDirected do
  @moduledoc false

  alias Schedule.Trip
  alias Schedule.Hastus.Place

  @type t :: %__MODULE__{
          id: Trip.id() | nil,
          kind: :wad | :rad,
          start_time: Util.Time.time_of_day(),
          end_time: Util.Time.time_of_day(),
          start_place: Place.id(),
          end_place: Place.id()
        }

  @enforce_keys [
    :id,
    :kind,
    :start_time,
    :end_time,
    :start_place,
    :end_place
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    :kind,
    :start_time,
    :end_time,
    :start_place,
    :end_place
  ]
end
