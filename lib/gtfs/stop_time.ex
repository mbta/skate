defmodule Gtfs.StopTime do
  @moduledoc """
  An individual stop time. A sequence of stop times composes a trip.

  A timepoint is a key stop along a route. In GTFS, timepoints are known as "checkpoints".
  """
  @derive Jason.Encoder

  alias Gtfs.Csv
  alias Gtfs.Data
  alias Gtfs.Helpers
  alias Gtfs.Stop
  alias Gtfs.Trip

  @type t :: %__MODULE__{
          timepoint_id: timepoint_id(),
          stop_id: Stop.id()
        }

  @enforce_keys [
    :timepoint_id,
    :stop_id
  ]

  defstruct [
    :timepoint_id,
    :stop_id
  ]

  @type timepoint_id :: String.t()

  @type trip_id_set :: MapSet.t(Trip.id())

  @spec trip_stop_times_from_csv([Csv.row()]) :: Data.trip_stop_times()
  def trip_stop_times_from_csv(stop_times_csv) do
    stop_times_csv
    |> Enum.group_by(fn stop_time_row -> stop_time_row["trip_id"] end)
    |> Helpers.map_values(fn stop_times_on_trip ->
      stop_times_on_trip
      |> Enum.sort_by(fn stop_time_row -> stop_time_row["stop_sequence"] end)
      |> Enum.map(fn stop_time_row ->
        %__MODULE__{
          stop_id: stop_time_row["stop_id"],
          timepoint_id: stop_time_row["checkpoint_id"]
        }
      end)
    end)
  end

  @spec row_in_trip_id_set?(Csv.row(), trip_id_set) :: boolean
  def row_in_trip_id_set?(row, trip_id_set), do: MapSet.member?(trip_id_set, row["trip_id"])
end
