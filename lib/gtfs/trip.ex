defmodule Gtfs.Trip do
  alias Gtfs.Csv
  alias Gtfs.Route

  @type id :: String.t()

  @type t :: %__MODULE__{
          id: id(),
          route_id: Route.id()
        }

  @enforce_keys [
    :id,
    :route_id
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    :route_id
  ]

  @spec from_csv_row(Csv.row()) :: t()
  def from_csv_row(row) do
    %__MODULE__{
      id: row["trip_id"],
      route_id: row["route_id"]
    }
  end

  @spec row_in_route_id_set?(Csv.row(), MapSet.t(Route.id())) :: boolean
  def row_in_route_id_set?(row, route_id_set), do: MapSet.member?(route_id_set, row["route_id"])
end
