defmodule Gtfs.Route do
  alias Gtfs.{Csv, Data}

  @type id :: String.t()
  @type by_id(value) :: %{id() => value}

  @type t :: %__MODULE__{
          id: id(),
          description: String.t(),
          direction_names: direction_names()
        }

  @type direction_names :: %{
          0 => String.t(),
          1 => String.t()
        }

  @enforce_keys [
    :id,
    :description,
    :direction_names
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    :description,
    :direction_names
  ]

  @spec from_csv_row(Csv.row(), Data.directions_by_route_and_id()) :: t()
  def from_csv_row(row, directions_by_route_id) do
    id = row["route_id"]
    description = row["route_desc"]
    route_directions = Map.get(directions_by_route_id, id)

    %__MODULE__{
      id: id,
      description: description,
      direction_names: %{
        0 => route_directions[0] && route_directions[0].direction_name,
        1 => route_directions[1] && route_directions[1].direction_name
      }
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
