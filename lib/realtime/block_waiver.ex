defmodule Realtime.BlockWaiver do
  @moduledoc """
  A representation of known skipped work on a trip, entered by dispatch.
  Essentially this summarizes a set of StopTimeUpdate datapoints.
  """

  alias Concentrate.StopTimeUpdate
  alias Gtfs.Trip

  @type t :: %__MODULE__{
          trip_id: Trip.id(),
          start_time: Util.Time.time_of_day(),
          end_time: Util.Time.time_of_day(),
          remark: String.t() | nil
        }

  @enforce_keys [:trip_id, :start_time, :end_time]

  @derive Jason.Encoder

  defstruct [:trip_id, :start_time, :end_time, :remark]

  @spec from_trip_stop_time_updates(Trip.t(), [StopTimeUpdate.t()]) :: t() | nil
  def from_trip_stop_time_updates(_trip, []) do
    nil
  end

  def from_trip_stop_time_updates(trip, stop_time_updates) do
    stop_ids = Enum.map(stop_time_updates, & &1.stop_id)

    %__MODULE__{
      trip_id: trip.id,
      start_time: Trip.time_of_first_stop_matching(trip, stop_ids),
      end_time: Trip.time_of_last_stop_matching(trip, stop_ids),
      remark: stop_time_updates |> List.first() |> Map.get(:remark)
    }
  end
end
