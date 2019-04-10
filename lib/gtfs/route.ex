defmodule Gtfs.Route do
  alias Gtfs.Csv

  @type id :: String.t()

  @type t :: %__MODULE__{
          id: id()
        }

  @enforce_keys [
    :id
  ]

  @derive Jason.Encoder

  defstruct [
    :id
  ]

  @spec from_csv_row(Csv.row()) :: t()
  def from_csv_row(row) do
    %__MODULE__{
      id: row["route_id"]
    }
  end

  @spec bus_route_row?(Csv.row()) :: boolean
  def bus_route_row?(row), do: row["route_type"] == "3"
end
