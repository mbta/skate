defmodule Realtime.BlockWaiver do
  @moduledoc """
  A representation of known skipped work on a trip, entered by dispatch.
  Essentially this summarizes a set of StopTimeUpdate datapoints.
  """

  alias Concentrate.StopTimeUpdate
  alias Gtfs.{Block, Trip}
  alias Realtime.StopTimeUpdateStore

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
    |> Enum.map(&from_trip_stop_time_waivers(&1, date_for_block(block)))
  end

  @type trip_stop_time_waiver :: {Util.Time.time_of_day(), StopTimeUpdate.t() | nil}
  @spec trip_stop_time_waivers(Trip.t()) :: [trip_stop_time_waiver()]
  def trip_stop_time_waivers(trip) do
    stop_time_updates_fn =
      Application.get_env(
        :realtime,
        :stop_time_updates_fn,
        &StopTimeUpdateStore.stop_time_updates_for_trip/1
      )

    stop_time_updates = stop_time_updates_fn.(trip.id)

    Enum.map(trip.stop_times, fn stop_time ->
      {stop_time.time,
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

  def group_consecutive_sequences([{_time, nil} | tail], acc, working) do
    group_consecutive_sequences(tail, bank_working(acc, working))
  end

  def group_consecutive_sequences([trip_stop_time_waiver | tail], acc, []) do
    group_consecutive_sequences(tail, acc, [trip_stop_time_waiver])
  end

  def group_consecutive_sequences(
        [{time, stop_time_update} = trip_stop_time_waiver | tail],
        acc,
        working
      ) do
    {previous_time, previous_stop_time_update} = List.last(working)

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

  @spec from_trip_stop_time_waivers([trip_stop_time_waiver()], Date.t()) :: t()
  def from_trip_stop_time_waivers(trip_stop_time_waivers, date_for_block) do
    {start_time, %StopTimeUpdate{remark: remark}} = List.first(trip_stop_time_waivers)
    {end_time, _} = List.last(trip_stop_time_waivers)

    %__MODULE__{
      start_time: Util.Time.timestamp_for_time_of_day(start_time, date_for_block),
      end_time: Util.Time.timestamp_for_time_of_day(end_time, date_for_block),
      remark: remark
    }
  end

  @spec date_for_block(Block.t()) :: Date.t()
  defp date_for_block(block) do
    active_blocks_fn = Application.get_env(:realtime, :active_blocks_fn, &Gtfs.active_blocks/2)

    now = Util.Time.now()
    one_hour_ago = now - 60 * 60
    in_ten_minutes = now + 10 * 60

    {date, _blocks} =
      one_hour_ago
      |> active_blocks_fn.(in_ten_minutes)
      |> Enum.find(
        {Util.Time.today(), []},
        fn {_date, blocks} -> Enum.member?(blocks, block) end
      )

    date
  end
end
