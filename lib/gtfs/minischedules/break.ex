
defmodule Gtfs.Minischedules.Break do
  alias Gtfs.Hastus.Place

  @type break_type :: String.t()

  @type t :: %__MODULE__{
    break_type: break_type(),
    start_time: String.t(),
    end_time: String.t(),
    start_place: Place.id(),
    end_place: Place.id()
  }

  @enforce_keys [
    :break_type,
    :start_time,
    :end_time,
    :start_place,
    :end_place
  ]

  defstruct [
    :break_type,
    :start_time,
    :end_time,
    :start_place,
    :end_place
  ]
end
