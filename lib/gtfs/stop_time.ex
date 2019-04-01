defmodule Gtfs.StopTime do
  alias Gtfs.Trip
  alias Gtfs.Stop

  @type t :: %__MODULE__{
          trip_id: Trip.id(),
          stop_id: Stop.id()
        }

  @enforce_keys [
    :trip_id,
    :stop_id
  ]

  @derive Jason.Encoder

  defstruct [
    :trip_id,
    :stop_id
  ]

  @spec from_csv_row(%{required(String.t()) => String.t()}) :: t()
  def from_csv_row(row) do
    %__MODULE__{
      trip_id: row["trip_id"],
      stop_id: row["stop_id"]
    }
  end
end
