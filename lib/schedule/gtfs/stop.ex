defmodule Schedule.Gtfs.Stop do
  alias Schedule.Csv

  @type id :: String.t()

  @type t :: %__MODULE__{
          id: id(),
          name: String.t(),
          parent_station_id: id() | nil,
          latitude: float() | nil,
          longitude: float() | nil,
          is_station: boolean()
        }

  @enforce_keys [
    :id,
    :name
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    :name,
    :parent_station_id,
    :latitude,
    :longitude,
    :is_station
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
      name: row["stop_name"],
      parent_station_id: parent_station_id,
      latitude: parse_lat_lon(row["stop_lat"]),
      longitude: parse_lat_lon(row["stop_lon"]),
      is_station: row["location_type"] == "1"
    }
  end

  @spec parse_lat_lon(String.t()) :: float() | nil
  defp parse_lat_lon(""), do: nil
  defp parse_lat_lon(s), do: String.to_float(s)
end
