defmodule Realtime.BlockWaiver do
  @moduledoc """
  A representation of known skipped work on a trip, entered by dispatch.
  Essentially this summarizes a set of StopTimeUpdate datapoints.
  """

  alias Concentrate.BuslocTripUpdate
  alias Gtfs.Block
  alias Gtfs.Trip

  @type t :: %__MODULE__{
          trip_id: Trip.id(),
          start_time: Util.Time.time_of_day(),
          end_time: Util.Time.time_of_day(),
          remark: String.t() | nil
        }

  @type block_waivers_by_trip :: %{Trip.id() => t()}

  @enforce_keys [:trip_id, :start_time, :end_time]

  @derive Jason.Encoder

  defstruct [:trip_id, :start_time, :end_time, :remark]

  @spec from_trip_updates(BuslocTripUpdate.t()) :: block_waivers_by_trip()
  def from_trip_updates(trip_updates) do
    trip_updates
    |> Enum.map(&from_trip_update/1)
    |> Enum.filter(& &1)
    |> Map.new(fn block_waiver -> {block_waiver.trip_id, block_waiver} end)
  end

  @spec from_trip_update(BuslocTripUpdate.t()) :: t() | nil
  defp from_trip_update(tu) do
    trip = Gtfs.trip(tu.trip_id)
    stop_ids = Enum.map(tu.stop_time_updates, & &1.stop_id)

    case trip do
      %Trip{} ->
        %__MODULE__{
          trip_id: tu.trip_id,
          start_time: Trip.time_of_first_stop_matching(trip, stop_ids),
          end_time: Trip.time_of_last_stop_matching(trip, stop_ids),
          remark: tu.stop_time_updates |> List.first() |> Map.get(:remark)
        }

      nil ->
        nil
    end
  end

  @spec block_waivers_for_block(Block.t() | nil, block_waivers_by_trip()) ::
          block_waivers_by_trip() | nil
  def block_waivers_for_block(nil, _block_waivers_by_trip), do: nil

  def block_waivers_for_block(block, block_waivers_by_trip) do
    trip_ids = Enum.map(block, fn trip -> trip.id end)
    block_waivers = Map.take(block_waivers_by_trip, trip_ids)

    if Enum.empty?(block_waivers) do
      nil
    else
      block_waivers
    end
  end
end
