defmodule Schedule.Hastus.Activity do
  alias Schedule.Block
  alias Schedule.Csv
  alias Schedule.Hastus.{Place, Run, Schedule}

  @type t :: %__MODULE__{
          schedule_id: Schedule.id(),
          run_id: Run.id(),
          start_time: Util.Time.time_of_day(),
          end_time: Util.Time.time_of_day(),
          start_place: Place.id(),
          end_place: Place.id(),
          activity_type: String.t(),
          # present only for activity_type "Operator"
          # block ids elsewhere have a letter indicating the garage
          # the block id from the activity name is missing it
          # e.g. "57-11" instead of "A57-11"
          partial_block_id: Block.id() | nil
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
    :start_time,
    :end_time,
    :start_place,
    :end_place,
    :activity_type,
    :partial_block_id
  ]

  @spec from_csv_row(Csv.row()) :: t()
  def from_csv_row(row) do
    activity_type = row["activity_type"]

    partial_block_id =
      if activity_type == "Operator" do
        String.replace(row["activity_name"], " ", "")
      else
        nil
      end

    %__MODULE__{
      schedule_id: row["schedule_id"],
      run_id: Run.from_parts(row["area"], row["run_id"]),
      start_time: Util.Time.parse_hhmm(row["start_time"]),
      end_time: Util.Time.parse_hhmm(row["end_time"]),
      start_place: Place.map_input_place_id(row["start_place"]),
      end_place: Place.map_input_place_id(row["end_place"]),
      activity_type: activity_type,
      partial_block_id: partial_block_id
    }
  end

  @spec parse(binary() | nil) :: [t()]
  def parse(file_binary) do
    Csv.parse(
      file_binary,
      parse: &from_csv_row/1,
      format: :hastus
    )
  end

  @spec run_key(t()) :: Run.key()
  def run_key(activity) do
    {activity.schedule_id, activity.run_id}
  end
end
