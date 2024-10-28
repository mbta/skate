defmodule Schedule.Gtfs.Trip do
  @moduledoc false

  alias Schedule.Block
  alias Schedule.Csv
  alias Schedule.Gtfs.{Direction, Route, RoutePattern, Service, Shape}

  @type id :: Schedule.Trip.id()

  @type t :: %__MODULE__{
          id: id(),
          route_id: Route.id(),
          service_id: Service.id(),
          headsign: String.t(),
          direction_id: Direction.id(),
          block_id: Block.id(),
          # Shuttles do not have route_pattern_ids
          route_pattern_id: RoutePattern.id() | nil,
          shape_id: Shape.id()
        }

  @enforce_keys [
    :id,
    :route_id,
    :service_id,
    :headsign,
    :direction_id,
    :block_id,
    :shape_id
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    :route_id,
    :service_id,
    :headsign,
    :direction_id,
    :block_id,
    :route_pattern_id,
    :shape_id
  ]

  @spec parse(binary() | nil, MapSet.t(Route.id())) :: [t()]
  def parse(file_binary, route_ids) do
    Csv.parse(
      file_binary,
      filter: &row_in_route_id_set?(&1, route_ids),
      parse: &from_csv_row/1
    )
  end

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
      service_id: row["service_id"],
      headsign: row["trip_headsign"],
      direction_id: Direction.id_from_string(row["direction_id"]),
      block_id: row["block_id"],
      route_pattern_id: route_pattern_id,
      shape_id: row["shape_id"]
    }
  end

  @spec row_in_route_id_set?(Csv.row(), MapSet.t(Route.id())) :: boolean
  defp row_in_route_id_set?(row, route_id_set), do: MapSet.member?(route_id_set, row["route_id"])
end
