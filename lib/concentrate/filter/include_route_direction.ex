defmodule Concentrate.Filter.IncludeRouteDirection do
  @moduledoc """
  Adds route/direction ID for TripUpdates.
  """
  @behaviour Concentrate.Filter
  alias Concentrate.Filter.GTFS.Trips
  alias Concentrate.TripUpdate

  @impl Concentrate.Filter
  def filter(item, module \\ Trips)

  def filter(%TripUpdate{} = tu, module) do
    trip_id = TripUpdate.trip_id(tu)
    tu = update_route_direction(tu, trip_id, module)
    {:cont, tu}
  end

  def filter(other, _module) do
    {:cont, other}
  end

  defp update_route_direction(tu, nil, _) do
    tu
  end

  defp update_route_direction(tu, trip_id, module) do
    tu =
      if TripUpdate.route_id(tu) do
        tu
      else
        TripUpdate.update_route_id(tu, module.route_id(trip_id))
      end

    if TripUpdate.direction_id(tu) do
      tu
    else
      TripUpdate.update_direction_id(tu, module.direction_id(trip_id))
    end
  end
end
