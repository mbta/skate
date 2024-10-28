defmodule Schedule.Gtfs.Direction do
  @moduledoc false

  alias Schedule.Csv
  alias Schedule.Gtfs.Route

  @type id :: 0 | 1

  @type t :: %__MODULE__{
          route_id: Route.id(),
          direction_id: id(),
          direction_name: String.t()
        }

  @enforce_keys [
    :route_id,
    :direction_id,
    :direction_name
  ]

  @derive Jason.Encoder

  defstruct [
    :route_id,
    :direction_id,
    :direction_name
  ]

  @spec from_csv_row(Csv.row()) :: t()
  def from_csv_row(row) do
    %__MODULE__{
      route_id: row["route_id"],
      direction_id: id_from_string(row["direction_id"]),
      direction_name: row["direction"]
    }
  end

  @doc """
  Returns a Direction ID from a string

  iex> Schedule.Gtfs.Direction.id_from_string("0")
  0
  iex> Schedule.Gtfs.Direction.id_from_string("1")
  1
  """
  @spec id_from_string(String.t()) :: id()
  def id_from_string("0"), do: 0
  def id_from_string("1"), do: 1
end
