defmodule Gtfs.RoutePattern do
  alias Gtfs.Route
  alias Gtfs.Trip

  @type id :: String.t()

  @type t :: %__MODULE__{
          id: id(),
          route_id: Route.id(),
          representative_trip_id: Trip.id()
        }

  @enforce_keys [
    :id,
    :route_id,
    :representative_trip_id
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    :route_id,
    :representative_trip_id
  ]

  @spec from_csv_row(%{required(String.t()) => String.t()}) :: t()
  def from_csv_row(row) do
    %__MODULE__{
      id: row["route_pattern_id"],
      route_id: row["route_id"],
      representative_trip_id: row["representative_trip_id"]
    }
  end
end
