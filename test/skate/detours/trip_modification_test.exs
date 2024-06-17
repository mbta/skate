defmodule Skate.Detours.TripModificationTest do
  use ExUnit.Case
  alias Skate.Detours.TripModification

  doctest TripModification

  import Skate.Factory

  test "can take detour info" do
    route_pattern = build(:gtfs_route_pattern, representative_trip_id: "39-0-0-1")

    assert TripModification.for(%TripModification.Input{route_pattern: route_pattern}) ==
             %TripModification{
               selected_trips: [%TripModification.SelectedTrip{trip_ids: ["39-0-0-1"]}]
             }
  end
end
