defmodule Concentrate.GroupFilter.SkippedDepartures do
  @moduledoc """
  Ensures that we have correct departure times in the presence of SKIPPED
  stops.

  The last stop on a trip should not have a departure time. If the end of the
  trip is SKIPPED, the last actual stop has no departure.
  """
  @behaviour Concentrate.GroupFilter
  alias Concentrate.StopTimeUpdate

  def filter({trip_update, vehicle_positions, stop_time_updates}) do
    reverse_updates = Enum.reverse(stop_time_updates)

    {skipped, rest} =
      Enum.split_while(reverse_updates, &(StopTimeUpdate.schedule_relationship(&1) == :SKIPPED))

    new_updates =
      case {skipped, rest} do
        {[_ | _], [last_departure | rest]} ->
          last_departure = StopTimeUpdate.update_departure_time(last_departure, nil)
          # Reverse the rest (start of the trip), with the last departures
          # and the skipped stops (also reversed) at the end. This is 25%
          # faster than the naive `Enum.concat |> Enum.reverse`.
          Enum.reverse(rest, [last_departure | Enum.reverse(skipped)])

        _ ->
          stop_time_updates
      end

    {trip_update, vehicle_positions, new_updates}
  end
end
