defmodule Realtime.StopTimeUpdatesByTrip do
  @moduledoc false

  alias Concentrate.StopTimeUpdate
  alias Schedule.Trip

  @type t :: %{Trip.id() => [StopTimeUpdate.t()]}

  @spec stop_time_updates_for_trip(t(), Trip.id()) :: [StopTimeUpdate.t()]
  def stop_time_updates_for_trip(stop_time_updates_by_trip, trip_id) do
    Map.get(stop_time_updates_by_trip, trip_id, [])
  end

  @spec trip_ids(t()) :: [Trip.id()]
  def trip_ids(stop_time_updates_by_trip) do
    Map.keys(stop_time_updates_by_trip)
  end
end
