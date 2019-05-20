defmodule Gtfs.Trip do
  alias Gtfs.Csv
  alias Gtfs.Route
  alias Gtfs.RoutePattern
  alias Gtfs.StopTime

  @type id :: String.t()

  @type t :: %__MODULE__{
          id: id(),
          route_id: Route.id(),
          headsign: String.t(),
          # Shuttles do not have route_pattern_ids
          route_pattern_id: RoutePattern.id() | nil,
          stop_times: [StopTime.t()]
        }

  @enforce_keys [
    :id,
    :route_id,
    :headsign
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    :route_id,
    :headsign,
    :route_pattern_id,
    stop_times: []
  ]

  @spec from_csv_row(Csv.row()) :: t()
  def from_csv_row(row) do
    route_pattern_id =
      case row["route_pattern_id"] do
        "" -> nil
        route_pattern_id -> route_pattern_id
      end

    %__MODULE__{
      id: row["trip_id"],
      route_id: row["route_id"],
      headsign: row["trip_headsign"],
      route_pattern_id: route_pattern_id
    }
  end

  @spec row_in_route_id_set?(Csv.row(), MapSet.t(Route.id())) :: boolean
  def row_in_route_id_set?(row, route_id_set), do: MapSet.member?(route_id_set, row["route_id"])
end
