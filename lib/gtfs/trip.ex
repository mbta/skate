defmodule Gtfs.Trip do
  @type id :: String.t()

  @type t :: %__MODULE__{
          id: id(),
          route: Gtfs.Route.id()
        }

  @enforce_keys [
    :id,
    :route
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    :route
  ]

  @spec from_csv_row(%{required(String.t()) => String.t()}) :: t()
  def from_csv_row(row) do
    %__MODULE__{
      id: row["trip_id"],
      route: row["route_id"]
    }
  end
end
