defmodule Static.Hastus.Trip do
  alias Static.Csv
  alias Static.{Block, Route, Trip}
  alias Static.Hastus.{Place, Run, Schedule}

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
      start_place: row["start_place"],
      end_place: row["end_place"],
      route_id: nonempty_string(row["route_id"]),
      trip_id: row["trip_id"]
    }
  end

  @spec nonempty_string(String.t()) :: String.t() | nil
  defp nonempty_string(""), do: nil
  defp nonempty_string(s), do: s

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
end
