defmodule Realtime.TripModificationTest do
  use ExUnit.Case
  alias Realtime.TripModification

  import Skate.Factory

  doctest TripModification

  test "can take detour info" do
    route_pattern = build(:gtfs_route_pattern, representative_trip_id: "39-0-0-1")

    missed_stops = [
      build(:gtfs_stop, id: "1234"),
      build(:gtfs_stop, id: "1235"),
      build(:gtfs_stop, id: "1236")
    ]

    last_modified_time = DateTime.utc_now()
    service_date = Date.utc_today()

    assert TripModification.new(%TripModification.Input{
             route_pattern: route_pattern,
             missed_stops: missed_stops,
             service_date: service_date,
             last_modified_time: last_modified_time
           }) ==
             {:ok,
              %TripModification{
                selected_trips: [%TripModification.SelectedTrip{trip_ids: ["39-0-0-1"]}],
                service_dates: [Date.to_iso8601(service_date, :basic)],
                modifications: [
                  %TripModification.Modification{
                    start_stop_selector: %TripModification.StopSelector{stop_id: "1234"},
                    end_stop_selector: %TripModification.StopSelector{stop_id: "1236"},
                    last_modified_time: DateTime.to_unix(last_modified_time)
                  }
                ]
              }}
  end
end
