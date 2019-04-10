defmodule Gtfs.Trip do
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

  @spec from_csv_row(%{required(String.t()) => String.t()}) :: t()
  def from_csv_row(trip_row) do
    %__MODULE__{
      id: trip_row["trip_id"],
      route_id: trip_row["route_id"]
    }
  end

  @spec in_id_set?(%{required(String.t()) => String.t()}, MapSet.t(id())) :: boolean
  def in_id_set?(trip_row, id_set), do: MapSet.member?(id_set, trip_row["route_id"])
end
