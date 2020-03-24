defmodule Gtfs.Minischedules.Trip do
  alias Gtfs.Route
  alias Gtfs.Hastus.Place

  @type t :: %__MODULE__{
    route: Route.id() | nil,
    start_time: String.t(),
    end_time: String.t(),
    start_place: Place.id(),
    end_place: Place.id(),
  }

  @enforce_keys [
    :start_time,
    :end_time,
    :start_place,
    :end_place
  ]

  defstruct [
    :route,
    :start_time,
    :end_time,
    :start_place,
    :end_place
  ]
end
