defmodule Skate.Detours.TripModificationTest do
  use ExUnit.Case
  alias Skate.Detours.TripModification

  doctest TripModification

  import Skate.Factory

  test "can take detour info" do
    route_pattern = build(:gtfs_route_pattern, representative_trip_id: "39-0-0-1")

    missed_stops = [
      build(:gtfs_stop, id: "1234"),
      build(:gtfs_stop, id: "1235"),
      build(:gtfs_stop, id: "1236")
    ]

    assert TripModification.for(%TripModification.Input{
             route_pattern: route_pattern,
             missed_stops: missed_stops
           }) ==
             %TripModification{
               selected_trips: [%TripModification.SelectedTrip{trip_ids: ["39-0-0-1"]}],
               modifications: [
                 %TripModification.Modification{
                   start_stop_selector: "1234",
                   end_stop_selector: "1236"
                 }
               ]
             }
  end
end
