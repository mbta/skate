defmodule Realtime.BlockWaiver do
  @moduledoc """
  A representation of known skipped work on a trip, entered by dispatch.
  Essentially this summarizes a set of StopTimeUpdate datapoints.
  """

  alias Concentrate.StopTimeUpdate
  alias Schedule.{Block, Trip}
  alias Realtime.StopTimeUpdatesByTrip

  @type t :: %__MODULE__{
          start_time: Util.Time.timestamp(),
          end_time: Util.Time.timestamp(),
          cause_id: integer(),
          cause_description: String.t(),
          remark: String.t() | nil
        }

  @type block_waivers_by_block_key :: %{Block.key() => [t()]}

  @enforce_keys [
    :start_time,
    :end_time,
    :cause_id,
    :cause_description
  ]

  @derive Jason.Encoder

  defstruct [
    :start_time,
    :end_time,
    :cause_id,
    :cause_description,
    :remark
  ]

  # The full mapping between "cause_description" and "cause_id":
  # B - Manpower	      23
  # C - No Equipment	  24
  # D - Disabled Bus	  25
  # E - Diverted	      26
  # F - Traffic	        27
  # G - Accident	      28
  # H - Weather	        29
  # I - Operator Error	30
  # J - Other	          1
  # K - Adjusted	      31
  # L - Shuttle	        32
  # T - Inactive TM	    33

  @spec block_waivers_for_block(Block.t() | nil, StopTimeUpdatesByTrip.t()) :: [t()]
  def block_waivers_for_block(nil, _), do: []

  def block_waivers_for_block(block, stop_time_updates_by_trip) do
    block
    |> Block.revenue_trips()
    |> Enum.flat_map(&trip_stop_time_waivers(&1, stop_time_updates_by_trip))
    |> group_consecutive_sequences()
    |> Enum.map(&from_trip_stop_time_waivers(&1, Block.date_for_block(block)))
  end

  @type trip_stop_time_waiver :: {Util.Time.time_of_day(), StopTimeUpdate.t() | nil}
  @spec trip_stop_time_waivers(Trip.t(), StopTimeUpdatesByTrip.t()) :: [trip_stop_time_waiver()]
  def trip_stop_time_waivers(trip, stop_time_updates_by_trip) do
    stop_time_updates =
      StopTimeUpdatesByTrip.stop_time_updates_for_trip(stop_time_updates_by_trip, trip.id)

    Enum.map(trip.stop_times, fn stop_time ->
      {stop_time.time,
       Enum.find(
         stop_time_updates,
         fn stu ->
           StopTimeUpdate.stop_id(stu) == stop_time.stop_id &&
             is_block_waiver?(stu)
         end
       )}
    end)
  end

  @spec is_current?(t()) :: boolean()
  @doc """
  Returns whether or not the given block waiver is currently active
  based on its start and end times.
  """
  def is_current?(block_waiver) do
    now_fn = Application.get_env(:skate, :now_fn, &Util.Time.now/0)
    now = now_fn.()
    now > block_waiver.start_time && now < block_waiver.end_time
  end

  @spec is_block_waiver?(StopTimeUpdate.t()) :: boolean()
  def is_block_waiver?(stop_time_update) do
    # cause_id 33 is bad TransitMaster units.
    # Since we can fall back to swiftly data,
    # these block waivers don't matter to people using skate.
    StopTimeUpdate.cause_id(stop_time_update) != nil and
      StopTimeUpdate.cause_id(stop_time_update) != 33
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

    if same_cause?(stop_time_update, previous_stop_time_update) &&
         within_60_minutes?(time, previous_time) do
      group_consecutive_sequences(tail, acc, working ++ [trip_stop_time_waiver])
    else
      # Make a new group if the cause changes or there is more than 60 minutes between stops
      group_consecutive_sequences(tail, bank_working(acc, working), [trip_stop_time_waiver])
    end
  end

  @spec bank_working([[trip_stop_time_waiver()]], [trip_stop_time_waiver()]) :: [
          [trip_stop_time_waiver()]
        ]
  defp bank_working(acc, []), do: acc
  defp bank_working([], working), do: [working]
  defp bank_working(acc, working), do: acc ++ [working]

  @spec same_cause?(StopTimeUpdate.t(), StopTimeUpdate.t()) :: boolean()
  defp same_cause?(stu1, stu2) do
    StopTimeUpdate.cause_id(stu1) == StopTimeUpdate.cause_id(stu2) and
      StopTimeUpdate.remark(stu1) == StopTimeUpdate.remark(stu2)
  end

  @spec within_60_minutes?(Util.Time.time_of_day(), Util.Time.time_of_day()) :: boolean()
  defp within_60_minutes?(time, previous_time), do: time - previous_time <= 3600

  @spec from_trip_stop_time_waivers([trip_stop_time_waiver()], Date.t()) :: t()
  def from_trip_stop_time_waivers(trip_stop_time_waivers, date_for_block) do
    {start_time, stu} = List.first(trip_stop_time_waivers)
    {end_time, _} = List.last(trip_stop_time_waivers)

    %__MODULE__{
      start_time: Util.Time.timestamp_for_time_of_day(start_time, date_for_block),
      end_time: Util.Time.timestamp_for_time_of_day(end_time, date_for_block),
      cause_id: StopTimeUpdate.cause_id(stu),
      cause_description: StopTimeUpdate.cause_description(stu),
      remark: StopTimeUpdate.remark(stu)
    }
  end
end
