defmodule Gtfs.StopTime do
  alias Gtfs.Timepoint
  alias Gtfs.Trip
  alias Gtfs.Stop

  @type t :: %__MODULE__{
          trip_id: Trip.id(),
          stop_id: Stop.id(),
          stop_sequence: integer(),
          timepoint_id: Timepoint.id() | nil
        }

  @enforce_keys [
    :trip_id,
    :stop_id,
    :stop_sequence,
    :timepoint_id
  ]

  @derive Jason.Encoder

  defstruct [
    :trip_id,
    :stop_id,
    :stop_sequence,
    :timepoint_id
  ]

  @spec from_csv_row(%{required(String.t()) => String.t()}) :: t()
  def from_csv_row(row) do
    %__MODULE__{
      trip_id: row["trip_id"],
      stop_id: row["stop_id"],
      stop_sequence: String.to_integer(row["stop_sequence"]),
      timepoint_id: nil_if_empty(row["checkpoint_id"])
    }
  end

  @spec nil_if_empty(String.t()) :: String.t() | nil
  defp nil_if_empty(""), do: nil
  defp nil_if_empty(s), do: s
end
