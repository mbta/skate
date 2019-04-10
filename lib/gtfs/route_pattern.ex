defmodule Gtfs.RoutePattern do
  alias Gtfs.Direction
  alias Gtfs.Route
  alias Gtfs.Trip

  @type id :: String.t()

  @type t :: %__MODULE__{
          id: id(),
          route_id: Route.id(),
          direction_id: Direction.id(),
          representative_trip_id: Trip.id()
        }

  @enforce_keys [
    :id,
    :route_id,
    :direction_id,
    :representative_trip_id
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    :route_id,
    :direction_id,
    :representative_trip_id
  ]

  @spec from_csv_row(%{required(String.t()) => String.t()}) :: t()
  def from_csv_row(route_pattern_row) do
    %__MODULE__{
      id: route_pattern_row["route_pattern_id"],
      route_id: route_pattern_row["route_id"],
      direction_id: Direction.from_string(route_pattern_row["direction_id"]),
      representative_trip_id: route_pattern_row["representative_trip_id"]
    }
  end

  @spec in_id_set?(%{required(String.t()) => String.t()}, MapSet.t(id())) :: boolean
  def in_id_set?(route_pattern_row, id_set), do: MapSet.member?(id_set, route_pattern_row["route_id"])
end
