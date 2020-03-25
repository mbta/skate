defmodule Gtfs.Hastus.Activity do
  alias Gtfs.{Block, Csv, Run}
  alias Gtfs.Hastus.{Place, Schedule}

  @type t :: %__MODULE__{
          schedule_id: Schedule.id(),
          run_id: Run.id(),
          block_id: Block.id() | nil,
          start_time: String.t(),
          end_time: String.t(),
          start_place: Place.id(),
          end_place: Place.id(),
          activity_type: String.t()
        }

  @enforce_keys [
    :schedule_id,
    :run_id,
    :start_time,
    :end_time,
    :start_place,
    :end_place,
    :activity_type
  ]

  defstruct [
    :schedule_id,
    :run_id,
    :block_id,
    :start_time,
    :end_time,
    :start_place,
    :end_place,
    :activity_type
  ]

  @spec from_csv_row(Csv.row()) :: t()
  def from_csv_row(row) do
    activity_type = row["activity_type"]

    block_id =
      if activity_type == "Operator" do
        String.replace(row["activity_name"], " ", "")
      else
        nil
      end

    %__MODULE__{
      schedule_id: row["schedule_id"],
      run_id: run_id(row),
      block_id: block_id,
      start_time: row["start_time"],
      end_time: row["end_time"],
      start_place: row["start_place"],
      end_place: row["end_place"],
      activity_type: activity_type
    }
  end

  @spec run_id(Csv.row()) :: Run.id()
  def run_id(row) do
    "#{row["area"]}-#{String.pad_leading(row["run_id"], 4, "0")}"
  end

  @spec parse(binary() | nil) :: [t()]
  def parse(file_binary) do
    Csv.parse(
      file_binary,
      parse: &from_csv_row/1,
      format: :hastus
    )
  end
end
