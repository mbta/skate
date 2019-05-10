defmodule Concentrate.GroupFilter do
  @moduledoc """
  Defines a behavior for filtering over grouped realtime data.

  Each filter gets called for each trip group. A trip group is a TripUpdate
  (optional), a list of VehiclePositions, and a list of StopTimeUpdates. All
  the items in a group share a trip ID, and the StopTimeUpdates will be in
  order of their stop_sequence.
  """
  alias Concentrate.Encoder.GTFSRealtimeHelpers
  @callback filter(GTFSRealtimeHelpers.trip_group()) :: GTFSRealtimeHelpers.trip_group()
end
