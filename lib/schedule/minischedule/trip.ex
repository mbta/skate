defmodule Schedule.Minischedule.Trip do
  alias Schedule.Gtfs.{Direction, Route, RoutePattern}

  @type id :: Schedule.Trip.id()

  @type t :: %__MODULE__{
          id: id(),
          # nil means nonrevenue
          route_id: Route.id() | nil,
          direction_id: Direction.id() | nil,
          route_pattern_id: RoutePattern.id() | nil,
          headsign: String.t() | nil
        }

  @enforce_keys [
    :id
  ]

  defstruct [
    :id,
    route_id: nil,
    direction_id: nil,
    route_pattern_id: nil,
    headsign: nil
  ]

  @spec from_full_trip(Schedule.Trip.t()) :: t()
  def from_full_trip(full_trip) do
    %__MODULE__{
      id: full_trip.id,
      route_id: full_trip.route_id,
      direction_id: full_trip.direction_id,
      route_pattern_id: full_trip.route_pattern_id,
      headsign: full_trip.headsign
    }
  end
end
