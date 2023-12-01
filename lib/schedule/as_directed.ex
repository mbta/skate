defmodule Schedule.AsDirected do
  @moduledoc false

  alias Schedule.Hastus.Place

  @type t :: %__MODULE__{
          kind: :wad | :rad,
          start_time: Util.Time.time_of_day(),
          end_time: Util.Time.time_of_day(),
          start_place: Place.id(),
          end_place: Place.id()
        }

  @enforce_keys [
    :kind,
    :start_time,
    :end_time,
    :start_place,
    :end_place
  ]

  @derive Jason.Encoder

  defstruct [
    :kind,
    :start_time,
    :end_time,
    :start_place,
    :end_place
  ]
end
