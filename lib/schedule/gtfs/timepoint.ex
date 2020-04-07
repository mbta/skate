defmodule Schedule.Gtfs.Timepoint do
  alias Schedule.Csv

  @type id :: String.t()

  @type t :: %__MODULE__{
          id: id(),
          name: String.t() | nil
        }

  @type timepoints_by_id :: %{id() => t()}

  @enforce_keys [
    :id
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    name: nil
  ]

  @spec from_csv_row(Csv.row()) :: t()
  def from_csv_row(row) do
    %__MODULE__{
      id: row["checkpoint_id"],
      name: row["checkpoint_name"]
    }
  end

  @spec timepoint_for_id(timepoints_by_id(), id()) :: t()
  def timepoint_for_id(timepoints_by_id, id) do
    Map.get(timepoints_by_id, id, %__MODULE__{id: id})
  end
end
