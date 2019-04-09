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
  def from_csv_row(row) do
    %__MODULE__{
      id: row["trip_id"],
      route_id: row["route_id"]
    }
  end

  @spec member_of_routes?(MapSet.t(id()), %{required(String.t()) => String.t()}) :: boolean
  def member_of_routes?(route_ids, row), do: Enum.member?(route_ids, row["route_id"])
end
