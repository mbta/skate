defmodule GtfsTest do
  use ExUnit.Case, async: true

  alias Gtfs.Route
  alias Gtfs.StopTime
  alias Gtfs.Trip

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

  describe "timepoint_ids_on_route" do
    test "timepoint_ids_on_route" do
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
            "route_id,trip_id,route_pattern_id",
            "39,39-trip,39-_-0"
          ],
          "stop_times.txt" => [
            "trip_id,stop_sequence,checkpoint_id",
            "39-trip,1,check",
            "39-trip,2,",
            "blue-trip,1,other"
          ]
        })

      assert Gtfs.timepoint_ids_on_route("39", pid) == ["check"]
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
            "route_id,trip_id,route_pattern_id",
            "39,39-trip,39-_-0"
          ],
          "stop_times.txt" => [
            "trip_id,stop_sequence,checkpoint_id",
            "39-trip,1,check",
            "39-trip,2,",
            "blue-trip,1,check"
          ]
        })

      assert Gtfs.timepoint_ids_on_route("39", pid) == ["check"]
      assert Gtfs.timepoint_ids_on_route("Blue", pid) == []
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
            "route_id,trip_id,route_pattern_id",
            "route,t1,route-_-0",
            "route,t2,route-_-0",
            "route,t3,route-_-0"
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

      assert Gtfs.timepoint_ids_on_route("route", pid) == ["c1", "c2", "c3", "c4", "c5"]
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
            "route_id,trip_id,route_pattern_id",
            "route,t0,route-_-0",
            "route,t1,route-_-0"
          ],
          "stop_times.txt" => [
            "trip_id,stop_sequence,checkpoint_id",
            "t0,1,downtown",
            "t0,2,suburb",
            "t1,1,exurb",
            "t1,2,suburb"
          ]
        })

      assert Gtfs.timepoint_ids_on_route("route", pid) == ["exurb", "suburb", "downtown"]
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

      assert Gtfs.timepoint_ids_on_route("route", pid) == []
    end
  end

  describe "trip" do
    test "returns the trip, including stop_times" do
      pid =
        Gtfs.start_mocked(%{
          "routes.txt" => [
            "route_id,route_type",
            "route,3"
          ],
          "route_patterns.txt" => [
            "route_pattern_id,route_id,direction_id,representative_trip_id",
            "p1,route,1,t1"
          ],
          "trips.txt" => [
            "route_id,trip_id,trip_headsign,route_pattern_id",
            "route,t1,h1,route-_-0"
          ],
          "stop_times.txt" => [
            "trip_id,stop_id,stop_sequence,checkpoint_id",
            "t1,s4,1,exurb",
            "t1,s5,2,",
            "t1,s3,3,suburb"
          ]
        })

      assert Gtfs.trip("t1", pid) == %Trip{
               id: "t1",
               route_id: "route",
               # Shuttles do not have route_pattern_ids
               headsign: "h1",
               route_pattern_id: "route-_-0",
               stop_times: [
                 %StopTime{stop_id: "s4", timepoint_id: "exurb"},
                 %StopTime{stop_id: "s5", timepoint_id: nil},
                 %StopTime{stop_id: "s3", timepoint_id: "suburb"}
               ]
             }
    end

    test "returns nil if the trip doesn't exist" do
      pid = Gtfs.start_mocked(%{})
      assert Gtfs.trip("39-trip", pid) == nil
    end
  end

  test "fetch_url/1 requests data from the given URL" do
    bypass = Bypass.open()
    url = "http://localhost:#{bypass.port}/MBTA_GTFS.zip"

    Bypass.expect(bypass, fn conn ->
      Plug.Conn.resp(conn, 200, "test-data")
    end)

    assert {:ok, %HTTPoison.Response{body: "test-data", status_code: 200}} = Gtfs.fetch_url(url)
  end
end
