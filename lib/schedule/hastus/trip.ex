defmodule Schedule.Hastus.Trip do
  alias Schedule.Csv
  alias Schedule.{Block, Route, Trip}
  alias Schedule.Hastus.{Place, Run, Schedule}

  @type t :: %__MODULE__{
          schedule_id: Schedule.id(),
          run_id: Run.id(),
          block_id: Block.id(),
          start_time: Util.Time.time_of_day(),
          end_time: Util.Time.time_of_day(),
          start_place: Place.id(),
          end_place: Place.id(),
          # nil means nonrevenue
          route_id: Route.id() | nil,
          trip_id: Trip.id()
        }

  @enforce_keys [
    :schedule_id,
    :run_id,
    :block_id,
    :start_time,
    :end_time,
    :start_place,
    :end_place,
    :trip_id
  ]

  defstruct [
    :schedule_id,
    :run_id,
    :block_id,
    :start_time,
    :end_time,
    :start_place,
    :end_place,
    :route_id,
    :trip_id
  ]

  @spec from_csv_row(Csv.row()) :: t()
  def from_csv_row(row) do
    %__MODULE__{
      schedule_id: row["schedule_id"],
      run_id: Run.from_parts(row["area"], row["run_id"]),
      block_id: String.replace(row["block_id"], " ", ""),
      start_time: Util.Time.parse_hhmm(row["start_time"]),
      end_time: Util.Time.parse_hhmm(row["end_time"]),
      start_place: Place.map_input_place_id(row["start_place"]),
      end_place: Place.map_input_place_id(row["end_place"]),
      route_id: route_id(row["route_id"]),
      trip_id: row["trip_id"]
    }
  end

  @spec route_id(String.t()) :: Route.id() | nil
  defp route_id(""), do: nil
  defp route_id("pull"), do: nil
  defp route_id(s), do: s

  @doc """
  Some rows in trips.csv are missing a lot of data. Drop them.
  """
  @spec complete_row?(Csv.row()) :: boolean()
  def complete_row?(row) do
    row["area"] != ""
  end

  @spec parse(binary() | nil) :: [t()]
  def parse(file_binary) do
    Csv.parse(
      file_binary,
      filter: &complete_row?/1,
      parse: &from_csv_row/1,
      format: :hastus
    )
  end

  @spec run_key(t()) :: Run.key()
  def run_key(trip) do
    {trip.schedule_id, trip.run_id}
  end

  @spec block_key(t()) :: Block.key()
  def block_key(trip) do
    {trip.schedule_id, trip.block_id}
  end
end
