defmodule Realtime.BlockWaiver do
  @moduledoc """
  A representation of known skipped work on a trip, entered by dispatch.
  Essentially this summarizes a set of StopTimeUpdate datapoints.
  """

  alias Concentrate.StopTimeUpdate
  alias Gtfs.{Block, Stop, Trip}
  alias Realtime.Server

  @type t :: %__MODULE__{
          start_time: Util.Time.time_of_day(),
          end_time: Util.Time.time_of_day(),
          remark: String.t() | nil
        }

  @enforce_keys [
    :start_time,
    :end_time
  ]

  @derive Jason.Encoder

  defstruct [
    :start_time,
    :end_time,
    :remark
  ]

  @spec block_waivers_for_block(Block.t() | nil) :: [t()]
  def block_waivers_for_block(nil), do: []

  def block_waivers_for_block(block) do
    block
    |> Enum.flat_map(&trip_stop_time_waivers/1)
    |> group_consecutive_sequences()
    |> Enum.map(&from_trip_stop_time_waivers/1)
  end

  @type trip_stop_time_waiver ::
          {Trip.id(), Stop.id(), Util.Time.time_of_day(), StopTimeUpdate.t() | nil}
  @spec trip_stop_time_waivers(Trip.t()) :: [trip_stop_time_waiver()]
  def trip_stop_time_waivers(trip) do
    stop_time_updates_fn =
      Application.get_env(:realtime, :stop_time_updates_fn, &Server.stop_time_updates_for_trip/1)

    stop_time_updates = stop_time_updates_fn.(trip.id)

    Enum.map(trip.stop_times, fn stop_time ->
      {trip.id, stop_time.stop_id, stop_time.time,
       Enum.find(stop_time_updates, &(StopTimeUpdate.stop_id(&1) == stop_time.stop_id))}
    end)
  end

  @spec group_consecutive_sequences([trip_stop_time_waiver()], [[trip_stop_time_waiver()]], [
          trip_stop_time_waiver()
        ]) :: [[trip_stop_time_waiver()]]
  def group_consecutive_sequences(trip_stop_time_waivers, acc \\ [], working \\ [])

  def group_consecutive_sequences([], acc, working) do
    bank_working(acc, working)
  end

  def group_consecutive_sequences([{_trip_id, _stop_id, _time, nil} | tail], acc, working) do
    group_consecutive_sequences(tail, bank_working(acc, working))
  end

  def group_consecutive_sequences([trip_stop_time_waiver | tail], acc, []) do
    group_consecutive_sequences(tail, acc, [trip_stop_time_waiver])
  end

  def group_consecutive_sequences(
        [{_trip_id, _stop_id, time, stop_time_update} = trip_stop_time_waiver | tail],
        acc,
        working
      ) do
    {_trip_id, _stop_id, previous_time, previous_stop_time_update} = List.last(working)

    if same_remark?(stop_time_update, previous_stop_time_update) &&
         within_60_minutes?(time, previous_time) do
      group_consecutive_sequences(tail, acc, working ++ [trip_stop_time_waiver])
    else
      # Make a new group if the remark changes or there is more than 60 minutes between stops
      group_consecutive_sequences(tail, bank_working(acc, working), [trip_stop_time_waiver])
    end
  end

  @spec bank_working([[trip_stop_time_waiver()]], [trip_stop_time_waiver()]) :: [
          [trip_stop_time_waiver()]
        ]
  defp bank_working(acc, []), do: acc
  defp bank_working([], working), do: [working]
  defp bank_working(acc, working), do: acc ++ [working]

  @spec same_remark?(map(), map()) :: boolean
  defp same_remark?(%StopTimeUpdate{remark: remark1}, %StopTimeUpdate{remark: remark2}),
    do: remark1 == remark2

  @spec within_60_minutes?(Util.Time.time_of_day(), Util.Time.time_of_day()) :: boolean
  defp within_60_minutes?(time, previous_time), do: time - previous_time <= 3600

  @spec from_trip_stop_time_waivers([trip_stop_time_waiver()]) :: t()
  def from_trip_stop_time_waivers(trip_stop_time_waivers) do
    {_, _, start_time, %StopTimeUpdate{remark: remark}} = List.first(trip_stop_time_waivers)
    {_, _, end_time, _} = List.last(trip_stop_time_waivers)

    %__MODULE__{
      start_time: start_time,
      end_time: end_time,
      remark: remark
    }
  end
end
