defmodule Concentrate.GroupFilter.CancelledTrip do
  @moduledoc """
  Cancels TripUpdates and and skips StopTimeUpdates for cancelled trips.
  """
  @behaviour Concentrate.GroupFilter
  alias Concentrate.Filter.Alert.CancelledTrips
  alias Concentrate.{StopTimeUpdate, TripUpdate}

  @impl Concentrate.GroupFilter
  def filter(trip_group, module \\ CancelledTrips)

  def filter({%TripUpdate{} = tu, _vps, [stu | _]} = group, module) do
    trip_id = TripUpdate.trip_id(tu)
    route_id = TripUpdate.route_id(tu)
    time = StopTimeUpdate.time(stu)

    cond do
      TripUpdate.schedule_relationship(tu) == :CANCELED ->
        cancel_group(group)

      is_nil(time) ->
        group

      is_binary(trip_id) and module.trip_cancelled?(trip_id, time) ->
        cancel_group(group)

      is_binary(route_id) and module.route_cancelled?(route_id, time) ->
        cancel_group(group)

      true ->
        group
    end
  end

  def filter(other, _module), do: other

  defp cancel_group({tu, vps, stus}) do
    tu = TripUpdate.cancel(tu)
    stus = Enum.map(stus, &StopTimeUpdate.skip/1)
    {tu, vps, stus}
  end
end
