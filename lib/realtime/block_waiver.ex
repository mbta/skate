defmodule Realtime.BlockWaiver do
  @moduledoc """
  A representation of known skipped work on a trip, entered by dispatch.
  Essentially this summarizes a set of StopTimeUpdate datapoints.
  """

  alias Concentrate.StopTimeUpdate
  alias Gtfs.{Block, Trip}
  alias Realtime.Server

  @type t :: %__MODULE__{
          trip_id: Trip.id(),
          start_time: Util.Time.time_of_day(),
          end_time: Util.Time.time_of_day(),
          remark: String.t() | nil
        }

  @type block_waivers_by_trip :: %{Trip.id() => t()}

  @enforce_keys [
    :trip_id,
    :start_time,
    :end_time
  ]

  @derive Jason.Encoder

  defstruct [
    :trip_id,
    :start_time,
    :end_time,
    :remark
  ]

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

  @spec block_waivers_for_block(Block.t() | nil) :: block_waivers_by_trip() | nil
  def block_waivers_for_block(nil), do: nil

  def block_waivers_for_block(block) do
    block_waivers =
      block
      |> Enum.map(&block_waiver_for_trip/1)
      |> Enum.reject(fn {_, v} -> is_nil(v) end)
      |> Map.new()

    if Enum.empty?(block_waivers) do
      nil
    else
      block_waivers
    end
  end

  @spec block_waiver_for_trip(Trip.t()) :: {Trip.id(), t()}
  defp block_waiver_for_trip(trip) do
    stop_time_updates_fn =
      Application.get_env(:realtime, :stop_time_updates_fn, &Server.stop_time_updates_for_trip/1)

    stop_time_updates = stop_time_updates_fn.(trip.id)

    {trip.id, from_trip_stop_time_updates(trip, stop_time_updates)}
  end
end
