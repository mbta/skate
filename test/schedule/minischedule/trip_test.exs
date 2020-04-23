defmodule Schedule.Minischedule.TripTest do
  use ExUnit.Case, async: true

  alias Schedule.Minischedule

  describe "from_full_trip" do
    test "works on a trip with gtfs and hastus data" do
      full_trip = %Schedule.Trip{
        id: "trip",
        block_id: "block",
        route_id: "route",
        headsign: "headsign",
        direction_id: 1,
        route_pattern_id: "route_pattern",
        schedule_id: "schedule",
        run_id: "run",
        stop_times: []
      }

      assert Minischedule.Trip.from_full_trip(full_trip) == %Minischedule.Trip{
               id: "trip",
               route_id: "route",
               direction_id: 1,
               route_pattern_id: "route_pattern",
               headsign: "headsign"
             }
    end

    test "works on a nonrevenue trip" do
      full_trip = %Schedule.Trip{
        id: "trip",
        block_id: "block",
        route_id: nil,
        schedule_id: "schedule",
        run_id: "run"
      }

      assert Minischedule.Trip.from_full_trip(full_trip) == %Minischedule.Trip{
               id: "trip",
               route_id: nil,
               direction_id: nil,
               route_pattern_id: nil,
               headsign: nil
             }
    end
  end
end
