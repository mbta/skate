defmodule Gtfs.Route do
  alias Gtfs.{Csv, Data, Direction}

  @type id :: String.t()

  @type t :: %__MODULE__{
          id: id(),
          directions: directions_by_id()
        }

  @type directions_by_id :: %{Direction.id() => Direction.t()}

  @enforce_keys [
    :id,
    :directions
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    :directions
  ]

  @spec from_csv_row(Csv.row(), Data.directions_by_route_and_id()) :: t()
  def from_csv_row(row, directions_by_route_id) do
    id = row["route_id"]

    %__MODULE__{
      id: id,
      directions: Map.get(directions_by_route_id, id)
    }
  end

  @spec bus_route_row?(Csv.row()) :: boolean
  def bus_route_row?(row) do
    # Verify that "route_type" exists on the row, especially to prevent issues while testing
    if row["route_type"] == nil do
      raise ArgumentError, message: "route_type is required on route rows"
    end

    row["route_type"] == "3"
  end
end
