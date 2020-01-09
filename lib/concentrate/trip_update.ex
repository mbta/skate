defmodule Concentrate.TripUpdate do
  @moduledoc """
  TripUpdate represents a (potential) change to a GTFS trip.
  """
  import Concentrate.StructHelpers

  defstruct_accessors([
    :trip_id,
    :route_id,
    :direction_id,
    :start_date,
    :start_time,
    schedule_relationship: :SCHEDULED
  ])
end
