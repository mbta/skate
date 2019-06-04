defmodule Gtfs.RoutePattern do
  alias Gtfs.Csv
  alias Gtfs.Direction
  alias Gtfs.Route
  alias Gtfs.Trip

  @type id :: String.t()

  @doc """
  A one-character id for disambiguating variants within a given route_id and direction_id
  a member of [0-9A-Z_]
  """
  @type via_variant :: String.t()

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

  @spec from_csv_row(Csv.row()) :: t()
  def from_csv_row(row) do
    %__MODULE__{
      id: row["route_pattern_id"],
      route_id: row["route_id"],
      direction_id: Direction.id_from_string(row["direction_id"]),
      representative_trip_id: row["representative_trip_id"]
    }
  end

  @spec row_in_route_id_set?(Csv.row(), MapSet.t(Route.id())) :: boolean
  def row_in_route_id_set?(row, route_id_set),
    do: MapSet.member?(route_id_set, row["route_id"])

  @spec for_route_id([t()], Route.id()) :: [t()]
  def for_route_id(route_patterns, route_id),
    do: Enum.filter(route_patterns, fn route_pattern -> route_pattern.route_id == route_id end)

  @spec by_direction([t()]) :: %{Direction.id() => [t()]}
  def by_direction(route_patterns),
    do: Enum.group_by(route_patterns, fn route_pattern -> route_pattern.direction_id end)

  @doc """
  via_variants are given by hastus, but not propogated through GTFS.
  But we can reconstruct them from the route_pattern_id
  in the route_pattern_id "116-4-1"
  "116" is the route_id,
  "4" is the via_variant,
  and "1" is the direction_id
  """
  @spec via_variant(id()) :: via_variant()
  def via_variant(route_pattern_id) do
    "-" <> <<via_variant::bytes-size(1)>> <> "-" <> <<_direction_id::bytes-size(1)>> =
      String.slice(route_pattern_id, -4..-1)

    via_variant
  end
end
