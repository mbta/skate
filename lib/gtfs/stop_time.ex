defmodule Gtfs.StopTime do
  alias Gtfs.Timepoint
  alias Gtfs.Trip
  alias Gtfs.Stop

  @type t :: %__MODULE__{
          trip_id: Trip.id(),
          stop_id: Stop.id(),
          timepoint_id: Timepoint.id()
        }

  @enforce_keys [
    :trip_id,
    :stop_id,
    :timepoint_id
  ]

  @derive Jason.Encoder

  defstruct [
    :trip_id,
    :stop_id,
    :timepoint_id
  ]

  @spec from_csv_row(%{required(String.t()) => String.t()}) :: t()
  def from_csv_row(row) do
    %__MODULE__{
      trip_id: row["trip_id"],
      stop_id: row["stop_id"],
      timepoint_id: row["checkpoint_id"]
    }
  end
end
