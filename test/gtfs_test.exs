defmodule GtfsTest do
  use ExUnit.Case, async: true

  alias Gtfs.Route

  doctest Gtfs

  describe "all_routes" do
    test "all_routes" do
      {:ok, pid} =
        Gtfs.start_mocked(%{
          "routes.txt" => [
            "route_id,route_long_name",
            "Red,Red Line"
          ]
        })

      assert Gtfs.all_routes(pid) == [
               %Route{id: "Red"}
             ]
    end
  end

  describe "timepoints_on_route" do
    test "timepoints_on_route" do
      {:ok, pid} =
        Gtfs.start_mocked(%{
          "route_patterns.txt" => [
            "route_pattern_id,route_id,direction_id,representative_trip_id",
            "red-pattern,Red,1,red-trip",
            "blue-pattern,Blue,1,blue-trip"
          ],
          "stop_times.txt" => [
            "trip_id,stop_sequence,checkpoint_id",
            "red-trip,1,check",
            "red-trip,2,",
            "blue-trip,1,other"
          ]
        })

      assert Gtfs.timepoints_on_route("Red", pid) == ["check"]
    end

    test "merges multiple trips into a coherent order" do
      {:ok, pid} =
        Gtfs.start_mocked(%{
          "route_patterns.txt" => [
            "route_pattern_id,route_id,direction_id,representative_trip_id",
            "p1,route,1,t1",
            "p2,route,1,t2",
            "p3,route,1,t3"
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

      assert Gtfs.timepoints_on_route("route", pid) == ["c1", "c2", "c3", "c4", "c5"]
    end

    test "merges stops from both directions, flipping direction 0" do
      {:ok, pid} =
        Gtfs.start_mocked(%{
          "route_patterns.txt" => [
            "route_pattern_id,route_id,direction_id,representative_trip_id",
            "p0,route,0,t0",
            "p1,route,1,t1"
          ],
          "stop_times.txt" => [
            "trip_id,stop_sequence,checkpoint_id",
            "t0,1,downtown",
            "t0,2,suburb",
            "t1,1,exurb",
            "t1,2,suburb"
          ]
        })

      assert Gtfs.timepoints_on_route("route", pid) == ["exurb", "suburb", "downtown"]
    end
  end
end
