defmodule Gtfs.StopTime do
  @type t :: %__MODULE__{
          trip: Gtfs.Trip.id(),
          stop: Gtfs.Stop.id()
        }

  @enforce_keys [
    :trip,
    :stop
  ]

  @derive Jason.Encoder

  defstruct [
    :trip,
    :stop
  ]

  @spec from_csv_row(%{required(String.t()) => String.t()}) :: t()
  def from_csv_row(row) do
    %__MODULE__{
      trip: row["trip_id"],
      stop: row["stop_id"]
    }
  end
end
