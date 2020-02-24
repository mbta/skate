defmodule Gtfs.Timepoint do
  alias Gtfs.Csv

  @type id :: String.t()

  @type t :: %__MODULE__{
          id: id(),
          name: String.t() | nil
        }

  @enforce_keys [
    :id,
    :name
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    :name
  ]

  @spec from_csv_row(Csv.row()) :: t()
  def from_csv_row(row) do
    %__MODULE__{
      id: row["checkpoint_id"],
      name: row["checkpoint_name"]
    }
  end
end
