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
  def from_csv_row(route_row) do
    %__MODULE__{
      id: route_row["route_id"]
    }
  end

  @spec bus_route?(Csv.row()) :: boolean
  def bus_route?(route_row), do: route_row["route_type"] == "3"
end
