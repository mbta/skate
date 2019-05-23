defmodule Gtfs.Stop do
  alias Gtfs.Csv

  @type id :: String.t()

  @type t :: %__MODULE__{
          id: id(),
          parent_station_id: id() | nil
        }

  @enforce_keys [
    :id,
    :parent_station_id
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    :parent_station_id
  ]

  @spec parent_station_id(t() | nil) :: id() | nil
  def parent_station_id(nil), do: nil
  def parent_station_id(%__MODULE__{id: id, parent_station_id: nil}), do: id
  def parent_station_id(%__MODULE__{parent_station_id: parent_station_id}), do: parent_station_id

  @spec from_csv_row(Csv.row()) :: t()
  def from_csv_row(row) do
    parent_station_id = if row["parent_station"] == "", do: nil, else: row["parent_station"]

    %__MODULE__{
      id: row["stop_id"],
      parent_station_id: parent_station_id
    }
  end
end
