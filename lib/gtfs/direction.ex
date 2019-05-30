defmodule Gtfs.Direction do
  alias Gtfs.{Csv, Route}

  @type id :: 0 | 1

  @type t :: %__MODULE__{
          route_id: Route.id(),
          direction_id: id(),
          direction_name: String.t(),
          direction_destination: String.t()
        }

  @enforce_keys [
    :route_id,
    :direction_id,
    :direction_name,
    :direction_destination
  ]

  @derive Jason.Encoder

  defstruct [
    :route_id,
    :direction_id,
    :direction_name,
    :direction_destination
  ]

  @spec from_csv_row(Csv.row()) :: t()
  def from_csv_row(row) do
    %__MODULE__{
      route_id: row["route_id"],
      direction_id: id_from_string(row["direction_id"]),
      direction_name: row["direction"],
      direction_destination: row["direction_destination"]
    }
  end

  @doc """
  Returns a Direction ID from a string

  iex> Gtfs.Direction.id_from_string("0")
  0
  iex> Gtfs.Direction.id_from_string("1")
  1
  """
  @spec id_from_string(String.t()) :: id()
  def id_from_string("0"), do: 0
  def id_from_string("1"), do: 1
end
