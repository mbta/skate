defmodule Gtfs.Route do
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

  @spec from_csv_row(%{required(String.t()) => String.t()}) :: t()
  def from_csv_row(row) do
    %__MODULE__{
      id: row["route_id"]
    }
  end

  @spec bus_route?(%{required(String.t()) => String.t()}) :: boolean
  def bus_route?(row), do: row["route_type"] == "3"
end
