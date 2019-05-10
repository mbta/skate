defmodule Concentrate.GroupFilter.SkippedStopOnAddedTrip do
  @moduledoc """
  Removes SKIPPED stops from ADDED/UNSCHEDULED trips.
  """
  @behaviour Concentrate.GroupFilter
  alias Concentrate.{StopTimeUpdate, TripUpdate}

  @impl Concentrate.GroupFilter
  def filter({%TripUpdate{} = tu, vps, stus}) do
    stus =
      if TripUpdate.schedule_relationship(tu) in ~w(ADDED UNSCHEDULED)a do
        Enum.reject(stus, &(StopTimeUpdate.schedule_relationship(&1) == :SKIPPED))
      else
        stus
      end

    {tu, vps, stus}
  end

  def filter(other), do: other
end
