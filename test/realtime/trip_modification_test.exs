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

    shape_with_stops =
      build(:shape_with_stops,
        id: "id-of-the-shape",
        stops: build_list(5, :gtfs_stop)
      )

    last_modified_time = DateTime.utc_now()
    service_date = Date.utc_today()

    assert TripModification.new(%TripModification.Input{
             route_pattern: route_pattern,
             missed_stops: missed_stops,
             shape_with_stops: shape_with_stops,
             service_date: service_date,
             last_modified_time: last_modified_time
           }) ==
             {:ok,
              %TripModification{
                selected_trips: [
                  %TripModification.SelectedTrip{
                    trip_ids: ["39-0-0-1"],
                    shape_id: "id-of-the-shape"
                  }
                ],
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

  test "returns an error if there are duplicate stops in the original shape" do
    shape_with_stops =
      build(:shape_with_stops,
        stops: [
          build(:gtfs_stop, id: "1234"),
          build(:gtfs_stop, id: "1235"),
          build(:gtfs_stop, id: "1236"),
          build(:gtfs_stop, id: "1235")
        ]
      )

    assert TripModification.new(%TripModification.Input{
             route_pattern: build(:gtfs_route_pattern),
             missed_stops: build_list(3, :gtfs_stop),
             shape_with_stops: shape_with_stops,
             service_date: Date.utc_today(),
             last_modified_time: DateTime.utc_now()
           }) == {:error, :duplicate_stops_in_shape}
  end
end
