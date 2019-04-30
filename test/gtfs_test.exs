defmodule GtfsTest do
  use ExUnit.Case, async: true

  alias Gtfs.Route
  alias Gtfs.Timepoint

  describe "all_routes" do
    test "maps each row to a Route" do
      pid =
        Gtfs.start_mocked(%{
          "routes.txt" => [
            "route_id,route_long_name,route_type",
            "39,Forest Hills - Back Bay Station,3"
          ]
        })

      assert Gtfs.all_routes(pid) == [
               %Route{id: "39"}
             ]
    end

    test "filters out non-bus routes" do
      pid =
        Gtfs.start_mocked(%{
          "routes.txt" => [
            "route_id,route_long_name,route_type",
            "Red,Red Line,1",
            "39,Forest Hills - Back Bay Station,3"
          ]
        })

      refute Enum.member?(Gtfs.all_routes(pid), %Route{id: "Red"})
    end
  end

  describe "timepoints_on_route" do
    test "timepoints_on_route" do
      pid =
        Gtfs.start_mocked(%{
          "routes.txt" => [
            "route_id,route_type",
            "39,3"
          ],
          "route_patterns.txt" => [
            "route_pattern_id,route_id,direction_id,representative_trip_id",
            "39-pattern,39,1,39-trip",
            "blue-pattern,Blue,1,blue-trip"
          ],
          "trips.txt" => [
            "route_id,trip_id",
            "39,39-trip"
          ],
          "stop_times.txt" => [
            "trip_id,stop_sequence,checkpoint_id",
            "39-trip,1,check",
            "39-trip,2,",
            "blue-trip,1,other"
          ]
        })

      assert Gtfs.timepoints_on_route("39", pid) == [%Timepoint{id: "check", stop_id: nil}]
    end

    test "filters out non-bus trips, route patterns, and timepoints" do
      pid =
        Gtfs.start_mocked(%{
          "routes.txt" => [
            "route_id,route_type",
            "39,3",
            "Blue,1"
          ],
          "route_patterns.txt" => [
            "route_pattern_id,route_id,direction_id,representative_trip_id",
            "39-pattern,39,1,39-trip",
            "blue-pattern,Blue,1,blue-trip"
          ],
          "trips.txt" => [
            "route_id,trip_id",
            "39,39-trip"
          ],
          "stop_times.txt" => [
            "trip_id,stop_sequence,checkpoint_id",
            "39-trip,1,check",
            "39-trip,2,",
            "blue-trip,1,check"
          ]
        })

      assert Gtfs.timepoints_on_route("39", pid) == [%Timepoint{id: "check", stop_id: nil}]
      assert Gtfs.timepoints_on_route("Blue", pid) == []
    end

    test "merges multiple trips into a coherent order" do
      pid =
        Gtfs.start_mocked(%{
          "routes.txt" => [
            "route_id,route_type",
            "route,3"
          ],
          "route_patterns.txt" => [
            "route_pattern_id,route_id,direction_id,representative_trip_id",
            "p1,route,1,t1",
            "p2,route,1,t2",
            "p3,route,1,t3"
          ],
          "trips.txt" => [
            "route_id,trip_id",
            "route,t1",
            "route,t2",
            "route,t3"
          ],
          "stop_times.txt" => [
            "trip_id,stop_sequence,checkpoint_id",
            "t1,11,c1",
            "t1,12,c2",
            "t3,31,c4",
            "t3,32,c5",
            "t2,21,c2",
            "t2,22,c3",
            "t2,23,c4"
          ]
        })

      assert Gtfs.timepoints_on_route("route", pid) == [
               %Timepoint{id: "c1", stop_id: nil},
               %Timepoint{id: "c2", stop_id: nil},
               %Timepoint{id: "c3", stop_id: nil},
               %Timepoint{id: "c4", stop_id: nil},
               %Timepoint{id: "c5", stop_id: nil}
             ]
    end

    test "merges stops from both directions, flipping direction 0" do
      pid =
        Gtfs.start_mocked(%{
          "routes.txt" => [
            "route_id,route_type",
            "route,3"
          ],
          "route_patterns.txt" => [
            "route_pattern_id,route_id,direction_id,representative_trip_id",
            "p0,route,0,t0",
            "p1,route,1,t1"
          ],
          "trips.txt" => [
            "route_id,trip_id",
            "route,t0",
            "route,t1"
          ],
          "stop_times.txt" => [
            "trip_id,stop_sequence,checkpoint_id",
            "t0,1,downtown",
            "t0,2,suburb",
            "t1,1,exurb",
            "t1,2,suburb"
          ]
        })

      assert Gtfs.timepoints_on_route("route", pid) == [
               %Timepoint{id: "exurb", stop_id: nil},
               %Timepoint{id: "suburb", stop_id: nil},
               %Timepoint{id: "downtown", stop_id: nil}
             ]
    end

    test "gracefully returns [] for route without timepoints" do
      pid =
        Gtfs.start_mocked(%{
          "route_patterns.txt" => [
            "route_pattern_id,route_id,direction_id,representative_trip_id",
            "pattern,route,0,trip"
          ],
          "stop_times.txt" => [
            "trip_id,stop_sequence,checkpoint_id",
            "trip,0,"
          ]
        })

      assert Gtfs.timepoints_on_route("route", pid) == []
    end
  end

  describe "stops_on_route/2" do
    test "returns all the stops on this route, both direction" do
      pid =
        Gtfs.start_mocked(%{
          "routes.txt" => [
            "route_id,route_type",
            "route,3"
          ],
          "route_patterns.txt" => [
            "route_pattern_id,route_id,direction_id,representative_trip_id",
            "p0,route,0,t0",
            "p1,route,1,t1"
          ],
          "trips.txt" => [
            "route_id,trip_id",
            "route,t0",
            "route,t1"
          ],
          "stop_times.txt" => [
            "trip_id,stop_id,stop_sequence,checkpoint_id",
            "t0,s1,1,downtown",
            "t0,s2,2,",
            "t0,s3,3,suburb",
            "t1,s4,1,exurb",
            "t1,s5,2,",
            "t1,s3,3,suburb"
          ]
        })

      assert Gtfs.stops_on_route("route", pid) == ["s4", "s5", "s3", "s2", "s1"]
    end
  end
end
