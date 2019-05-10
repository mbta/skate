defmodule Concentrate.GroupFilter.RemoveUnneededTimes do
  @moduledoc """
  Removes arrival times from the first stop on a trip, and the departure time from the last stop on a trip.
  """
  alias Concentrate.Filter.GTFS.PickupDropOff
  alias Concentrate.{StopTimeUpdate, TripUpdate}
  @behaviour Concentrate.GroupFilter

  @impl Concentrate.GroupFilter
  def filter(trip_group, module \\ PickupDropOff)

  def filter({%TripUpdate{} = tu, vps, stus} = group, module) do
    if TripUpdate.schedule_relationship(tu) == :SCHEDULED do
      trip_id = TripUpdate.trip_id(tu)
      stus = ensure_all_correct_times(stus, module, trip_id)
      {tu, vps, stus}
    else
      group
    end
  end

  def filter(other, _module), do: other

  defp ensure_all_correct_times([_ | _] = stus, module, trip_id) do
    [last | rest] = Enum.reverse(stus)
    last = ensure_correct_times_for_last_stu(last, module, trip_id)
    rest = Enum.map(rest, &ensure_correct_times(&1, module, trip_id))
    Enum.reverse(rest, [last])
  end

  defp ensure_all_correct_times([], _, _) do
    []
  end

  defp stop_sequence_or_stop_id(stu) do
    case StopTimeUpdate.stop_sequence(stu) do
      sequence when is_integer(sequence) ->
        sequence

      _ ->
        StopTimeUpdate.stop_id(stu)
    end
  end

  defp ensure_correct_times_for_last_stu(stu, module, trip_id) do
    # we only remove the departure time from the last stop (excepting SKIPPED stops)
    key = stop_sequence_or_stop_id(stu)

    case module.pickup_drop_off(trip_id, key) do
      {true, true} ->
        ensure_both_times(stu)

      {true, false} ->
        remove_arrival_time(stu)

      {false, true} ->
        remove_departure_time(stu)

      {false, false} ->
        StopTimeUpdate.skip(stu)

      _ ->
        # don't make changes if we don't know the pickup/drop-off values
        stu
    end
  end

  defp ensure_correct_times(stu, module, trip_id) do
    key = stop_sequence_or_stop_id(stu)

    case module.pickup_drop_off(trip_id, key) do
      {_, true} ->
        ensure_both_times(stu)

      {true, false} ->
        # not drop_off?
        remove_arrival_time(stu)

      {false, false} ->
        StopTimeUpdate.skip(stu)

      _ ->
        # don't make changes if we don't know the pickup/drop-off values
        stu
    end
  end

  defp ensure_both_times(stu) do
    arrival_time = StopTimeUpdate.arrival_time(stu)
    departure_time = StopTimeUpdate.departure_time(stu)

    case {arrival_time, departure_time} do
      {arrival_time, departure_time}
      when is_integer(departure_time) and is_integer(arrival_time) ->
        stu

      {nil, departure_time} when is_integer(departure_time) ->
        StopTimeUpdate.update_arrival_time(stu, departure_time)

      _ ->
        StopTimeUpdate.update_departure_time(stu, arrival_time)
    end
  end

  defp remove_arrival_time(stu) do
    if StopTimeUpdate.departure_time(stu) do
      StopTimeUpdate.update_arrival_time(stu, nil)
    else
      arrival_time = StopTimeUpdate.arrival_time(stu)
      StopTimeUpdate.update(stu, %{arrival_time: nil, departure_time: arrival_time})
    end
  end

  defp remove_departure_time(stu) do
    if StopTimeUpdate.arrival_time(stu) do
      StopTimeUpdate.update_departure_time(stu, nil)
    else
      departure_time = StopTimeUpdate.departure_time(stu)
      StopTimeUpdate.update(stu, %{departure_time: nil, arrival_time: departure_time})
    end
  end
end
