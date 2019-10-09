defmodule Gtfs.Run do
  @type id :: String.t()

  alias Gtfs.Csv
  alias Gtfs.Trip

  @spec run_ids_by_trip_id(binary()) :: %{Trip.id() => id()}
  def run_ids_by_trip_id(hastus_trips_data) do
    hastus_trips_data
    |> Csv.parse(
      format: :hastus,
      filter: fn row -> row["area"] != "" end,
      parse: &run_id_for_trip_id_from_row/1
    )
    |> Map.new()
  end

  @spec run_id_for_trip_id_from_row(Csv.row()) :: {Trip.id(), id()}
  def run_id_for_trip_id_from_row(row) do
    {row["trip_id"], "#{row["area"]}-#{row["run_id"]}"}
  end
end
