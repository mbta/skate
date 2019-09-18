defmodule GtfsTest do
  use ExUnit.Case, async: true

  alias Gtfs.{Route, Shape, ShapePoint, Stop, StopTime, Trip}

  describe "all_routes" do
    test "maps each row to a Route" do
      pid =
        Gtfs.start_mocked(%{
          "directions.txt" => [
            "route_id,direction_id,direction,direction_destination",
            "39,0,Outbound,Forest Hills",
            "39,1,Inbound,Back Bay Station"
          ],
          "routes.txt" => [
            "route_id,route_long_name,route_type,route_desc,route_short_name",
            "39,Forest Hills - Back Bay Station,3,Key Bus,39"
          ]
        })

      assert Gtfs.all_routes(pid) == [
               %Route{
                 id: "39",
                 description: "Key Bus",
                 direction_names: %{
                   0 => "Outbound",
                   1 => "Inbound"
                 },
                 name: "39"
               }
             ]
    end

    test "filters out non-bus routes" do
      pid =
        Gtfs.start_mocked(%{
          "routes.txt" => [
            "route_id,route_long_name,route_type,route_short_name",
            "Red,Red Line,1,",
            "39,Forest Hills - Back Bay Station,3,39"
          ]
        })

      refute Enum.any?(Gtfs.all_routes(pid), &(&1.id == "Red"))
    end
  end

  describe "stop" do
    test "returns stop" do
      pid =
        Gtfs.start_mocked(%{
          "stops.txt" => [
            "stop_id,stop_name,parent_station",
            "id,name,parent"
          ]
        })

      assert Gtfs.stop("id", pid) == %Stop{id: "id", name: "name", parent_station_id: "parent"}
    end

    test "returns nil if stop doesn't exist" do
      pid = Gtfs.start_mocked(%{})
      assert Gtfs.stop("id", pid) == nil
    end
  end

  describe "timepoint_ids_on_route" do
    test "timepoint_ids_on_route" do
      pid =
        Gtfs.start_mocked(%{
          "routes.txt" => [
            "route_id,route_type,route_short_name",
            "39,3,39"
          ],
          "route_patterns.txt" => [
            "route_pattern_id,route_id,direction_id,representative_trip_id",
            "39-pattern,39,1,39-trip",
            "blue-pattern,Blue,1,blue-trip"
          ],
          "trips.txt" => [
            "route_id,service_id,trip_id,trip_headsign,direction_id,block_id,route_pattern_id",
            "39,service,39-trip,headsign,0,block,39-_-0"
          ],
          "stop_times.txt" => [
            "trip_id,arrival_time,departure_time,stop_sequence,checkpoint_id",
            "39-trip,,00:00:00,1,check",
            "39-trip,,00:00:00,2,",
            "blue-trip,,00:00:00,1,other"
          ]
        })

      assert Gtfs.timepoint_ids_on_route("39", pid) == ["check"]
    end

    test "filters out non-bus trips, route patterns, and timepoints" do
      pid =
        Gtfs.start_mocked(%{
          "routes.txt" => [
            "route_id,route_type,route_short_name",
            "39,3,39",
            "Blue,1,Blue"
          ],
          "route_patterns.txt" => [
            "route_pattern_id,route_id,direction_id,representative_trip_id",
            "39-pattern,39,1,39-trip",
            "blue-pattern,Blue,1,blue-trip"
          ],
          "trips.txt" => [
            "route_id,service_id,trip_id,trip_headsign,direction_id,block_id,route_pattern_id",
            "39,service,39-trip,headsign,0,block,39-_-0"
          ],
          "stop_times.txt" => [
            "trip_id,arrival_time,departure_time,stop_sequence,checkpoint_id",
            "39-trip,,00:00:00,1,check",
            "39-trip,,00:00:00,2,",
            "blue-trip,,00:00:00,1,check"
          ]
        })

      assert Gtfs.timepoint_ids_on_route("39", pid) == ["check"]
      assert Gtfs.timepoint_ids_on_route("Blue", pid) == []
    end

    test "merges multiple trips into a coherent order" do
      pid =
        Gtfs.start_mocked(%{
          "routes.txt" => [
            "route_id,route_type,route_short_name",
            "route,3,39"
          ],
          "route_patterns.txt" => [
            "route_pattern_id,route_id,direction_id,representative_trip_id",
            "p1,route,1,t1",
            "p2,route,1,t2",
            "p3,route,1,t3"
          ],
          "trips.txt" => [
            "route_id,service_id,trip_id,trip_headsign,direction_id,block_id,route_pattern_id",
            "route,service,t1,h1,0,b1,route-_-0",
            "route,service,t2,h2,0,b2,route-_-0",
            "route,service,t3,h2,0,b2,route-_-0"
          ],
          "stop_times.txt" => [
            "trip_id,arrival_time,departure_time,stop_sequence,checkpoint_id",
            "t1,,00:00:00,11,c1",
            "t1,,00:00:00,12,c2",
            "t3,,00:00:00,31,c4",
            "t3,,00:00:00,32,c5",
            "t2,,00:00:00,21,c2",
            "t2,,00:00:00,22,c3",
            "t2,,00:00:00,23,c4"
          ]
        })

      assert Gtfs.timepoint_ids_on_route("route", pid) == ["c1", "c2", "c3", "c4", "c5"]
    end

    test "merges stops from both directions, flipping direction 0" do
      pid =
        Gtfs.start_mocked(%{
          "routes.txt" => [
            "route_id,route_type,route_short_name",
            "route,3,route"
          ],
          "route_patterns.txt" => [
            "route_pattern_id,route_id,direction_id,representative_trip_id",
            "p0,route,0,t0",
            "p1,route,1,t1"
          ],
          "trips.txt" => [
            "route_id,service_id,trip_id,trip_headsign,direction_id,block_id,route_pattern_id",
            "route,service,t0,h0,0,b0,route-_-0",
            "route,service,t1,h1,0,b1,route-_-0"
          ],
          "stop_times.txt" => [
            "trip_id,arrival_time,departure_time,stop_sequence,checkpoint_id",
            "t0,,00:00:00,1,downtown",
            "t0,,00:00:00,2,suburb",
            "t1,,00:00:00,1,exurb",
            "t1,,00:00:00,2,suburb"
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
            "trip_id,arrival_time,departure_time,stop_sequence,checkpoint_id",
            "trip,,00:00:01,0,"
          ]
        })

      assert Gtfs.timepoint_ids_on_route("route", pid) == []
    end
  end

  describe "stop/2" do
    test "returns the stop for this stop ID" do
      pid =
        Gtfs.start_mocked(%{
          "stops.txt" => [
            "stop_id,stop_name,parent_station",
            "1,One,",
            "2,Two,3"
          ]
        })

      assert Gtfs.stop("2", pid) == %Stop{
               id: "2",
               name: "Two",
               parent_station_id: "3"
             }
    end
  end

  describe "trip" do
    test "returns the trip, including stop_times" do
      pid =
        Gtfs.start_mocked(%{
          "routes.txt" => [
            "route_id,route_type,route_short_name",
            "route,3,route"
          ],
          "route_patterns.txt" => [
            "route_pattern_id,route_id,direction_id,representative_trip_id",
            "p1,route,1,t1"
          ],
          "trips.txt" => [
            "route_id,service_id,trip_id,trip_headsign,direction_id,block_id,route_pattern_id,shape_id",
            "route,service,t1,h1,1,b,route-_-0,shape1"
          ],
          "stop_times.txt" => [
            "trip_id,arrival_time,departure_time,stop_id,stop_sequence,checkpoint_id",
            "t1,,00:00:01,s4,1,exurb",
            "t1,,00:00:02,s5,2,",
            "t1,,00:00:03,s3,3,suburb"
          ]
        })

      assert Gtfs.trip("t1", pid) ==
               %Trip{
                 id: "t1",
                 route_id: "route",
                 service_id: "service",
                 headsign: "h1",
                 direction_id: 1,
                 block_id: "b",
                 route_pattern_id: "route-_-0",
                 shape_id: "shape1",
                 stop_times: [
                   %StopTime{stop_id: "s4", time: 1, timepoint_id: "exurb"},
                   %StopTime{stop_id: "s5", time: 2, timepoint_id: nil},
                   %StopTime{stop_id: "s3", time: 3, timepoint_id: "suburb"}
                 ]
               }
    end

    test "returns nil if the trip doesn't exist" do
      pid = Gtfs.start_mocked(%{})
      assert Gtfs.trip("t1", pid) == nil
    end
  end

  describe "block" do
    test "returns the list of trips on the block" do
      pid =
        Gtfs.start_mocked(%{
          "routes.txt" => [
            "route_id,route_type,route_short_name",
            "route,3,route"
          ],
          "route_patterns.txt" => [
            "route_pattern_id,route_id,direction_id,representative_trip_id",
            "p1,route,1,t1"
          ],
          "trips.txt" => [
            "route_id,service_id,trip_id,trip_headsign,direction_id,block_id,route_pattern_id,shape_id",
            "route,service,t1,h1,1,b,route-_-0,shape1"
          ],
          "stop_times.txt" => [
            "trip_id,arrival_time,departure_time,stop_id,stop_sequence,checkpoint_id",
            "t1,,00:00:01,s4,1,exurb",
            "t1,,00:00:02,s5,2,",
            "t1,,00:00:03,s3,3,suburb"
          ]
        })

      assert Gtfs.block("b", "service", pid) == [
               %Trip{
                 id: "t1",
                 route_id: "route",
                 service_id: "service",
                 # Shuttles do not have route_pattern_ids
                 headsign: "h1",
                 direction_id: 1,
                 block_id: "b",
                 route_pattern_id: "route-_-0",
                 shape_id: "shape1",
                 stop_times: [
                   %StopTime{stop_id: "s4", time: 1, timepoint_id: "exurb"},
                   %StopTime{stop_id: "s5", time: 2, timepoint_id: nil},
                   %StopTime{stop_id: "s3", time: 3, timepoint_id: "suburb"}
                 ]
               }
             ]
    end

    test "returns nil if the block doesn't exist" do
      pid = Gtfs.start_mocked(%{})
      assert Gtfs.block("b", "service", pid) == nil
    end
  end

  describe "active_trips" do
    test "returns trips that are active right now" do
      pid =
        Gtfs.start_mocked(%{
          "calendar.txt" => [
            "service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date",
            "today,1,1,1,1,1,1,1,20190101,20190101",
            "tomorrow,1,1,1,1,1,1,1,20190102,20190102"
          ],
          "routes.txt" => [
            "route_id,route_type,route_short_name",
            "route,3,route",
            "other_route,3,other_route"
          ],
          "trips.txt" => [
            "route_id,service_id,trip_id,trip_headsign,direction_id,block_id,route_pattern_id",
            "route,today,now,headsign,0,now,",
            "route,today,later,headsign,0,later,"
          ],
          "stop_times.txt" => [
            "trip_id,arrival_time,departure_time,stop_id,stop_sequence,checkpoint_id",
            "now,,00:00:01,stop1,1,",
            "now,,00:00:03,stop2,2,",
            "later,,00:00:04,stop1,1,"
          ]
        })

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800

      assert [%Trip{id: "now"}] = Gtfs.active_trips(time0 + 2, pid)
    end
  end

  describe "active_blocks" do
    test "returns only blocks that are active" do
      pid =
        Gtfs.start_mocked(%{
          "calendar.txt" => [
            "service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date",
            "today,1,1,1,1,1,1,1,20190101,20190101",
            "tomorrow,1,1,1,1,1,1,1,20190102,20190102"
          ],
          "routes.txt" => [
            "route_id,route_type,route_short_name",
            "route,3,route"
          ],
          "trips.txt" => [
            "route_id,service_id,trip_id,trip_headsign,direction_id,block_id,route_pattern_id",
            "route,today,now,headsign,0,now,",
            "route,today,later,headsign,0,later,",
            "route,tomorrow,tomorrow,headsign,0,tomorrow,"
          ],
          "stop_times.txt" => [
            "trip_id,arrival_time,departure_time,stop_id,stop_sequence,checkpoint_id",
            "now,,00:00:02,stop,1,",
            "later,,00:00:04,stop,1,",
            "tomorrow,,00:00:02,stop,1,"
          ]
        })

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800
      assert Gtfs.active_blocks(time0 + 1, time0 + 3, pid) == %{"route" => ["now"]}
    end
  end

  describe "shape" do
    test "returns the shapes for all trips corresponding to the requested shuttle route" do
      pid =
        Gtfs.start_mocked(%{
          "routes.txt" => [
            "route_id,route_type,route_short_name,route_desc",
            "route,3,route,\"Rail Replacement Bus\""
          ],
          "route_patterns.txt" => [
            "route_pattern_id,route_id,direction_id,representative_trip_id",
            "p1,route,1,t1"
          ],
          "trips.txt" => [
            "route_id,service_id,trip_id,trip_headsign,direction_id,block_id,route_pattern_id,shape_id",
            "route,service,t1,h1,1,b,route-_-0,shape1",
            "route,service,t2,h2,1,b,route-_-0,shape2"
          ],
          "stop_times.txt" => [
            "trip_id,arrival_time,departure_time,stop_id,stop_sequence,checkpoint_id",
            "t1,,00:00:01,s4,1,exurb",
            "t2,,00:00:01,s4,1,exurb"
          ],
          "shapes.txt" => [
            "shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled",
            "shape1,42.373178,-71.118170,0,",
            "shape2,43.373178,-72.118170,0,"
          ]
        })

      assert Gtfs.shape("route", pid) == [
               %Shape{
                 id: "shape1",
                 points: [
                   %ShapePoint{
                     shape_id: "shape1",
                     lat: 42.373178,
                     lon: -71.118170,
                     sequence: 0
                   }
                 ]
               },
               %Shape{
                 id: "shape2",
                 points: [
                   %ShapePoint{
                     shape_id: "shape2",
                     lat: 43.373178,
                     lon: -72.118170,
                     sequence: 0
                   }
                 ]
               }
             ]
    end

    test "dedupes shapes that are reused between trips" do
      pid =
        Gtfs.start_mocked(%{
          "routes.txt" => [
            "route_id,route_type,route_short_name,route_desc",
            "route,3,route,\"Rail Replacement Bus\""
          ],
          "route_patterns.txt" => [
            "route_pattern_id,route_id,direction_id,representative_trip_id",
            "p1,route,1,t1"
          ],
          "trips.txt" => [
            "route_id,service_id,trip_id,trip_headsign,direction_id,block_id,route_pattern_id,shape_id",
            "route,service,t1,h1,1,b,route-_-0,shape1",
            "route,service,t2,h2,1,b,route-_-0,shape1"
          ],
          "stop_times.txt" => [
            "trip_id,arrival_time,departure_time,stop_id,stop_sequence,checkpoint_id",
            "t1,,00:00:01,s4,1,exurb",
            "t2,,00:00:01,s4,1,exurb"
          ],
          "shapes.txt" => [
            "shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled",
            "shape1,42.373178,-71.118170,0,"
          ]
        })

      assert Gtfs.shape("route", pid) == [
               %Shape{
                 id: "shape1",
                 points: [
                   %ShapePoint{
                     shape_id: "shape1",
                     lat: 42.373178,
                     lon: -71.118170,
                     sequence: 0
                   }
                 ]
               }
             ]
    end

    test "sorts the shape points" do
      pid =
        Gtfs.start_mocked(%{
          "routes.txt" => [
            "route_id,route_type,route_short_name,route_desc",
            "route,3,route,\"Rail Replacement Bus\""
          ],
          "route_patterns.txt" => [
            "route_pattern_id,route_id,direction_id,representative_trip_id",
            "p1,route,1,t1"
          ],
          "trips.txt" => [
            "route_id,service_id,trip_id,trip_headsign,direction_id,block_id,route_pattern_id,shape_id",
            "route,service,t1,h1,1,b,route-_-0,shape"
          ],
          "stop_times.txt" => [
            "trip_id,arrival_time,departure_time,stop_id,stop_sequence,checkpoint_id",
            "t1,,00:00:01,s4,1,exurb"
          ],
          "shapes.txt" => [
            "shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled",
            "shape,43.373178,-73.118170,2,",
            "shape,42.373178,-72.118170,1,",
            "shape,41.373178,-71.118170,0,"
          ]
        })

      assert Gtfs.shape("route", pid) == [
               %Shape{
                 id: "shape",
                 points: [
                   %ShapePoint{
                     shape_id: "shape",
                     lat: 41.373178,
                     lon: -71.118170,
                     sequence: 0
                   },
                   %ShapePoint{
                     shape_id: "shape",
                     lat: 42.373178,
                     lon: -72.118170,
                     sequence: 1
                   },
                   %ShapePoint{
                     shape_id: "shape",
                     lat: 43.373178,
                     lon: -73.118170,
                     sequence: 2
                   }
                 ]
               }
             ]
    end

    test "does not save shapes for non-shuttle routes" do
      pid =
        Gtfs.start_mocked(%{
          "routes.txt" => [
            "route_id,route_type,route_short_name,route_desc",
            "route,3,route,\"Key Bus\""
          ],
          "route_patterns.txt" => [
            "route_pattern_id,route_id,direction_id,representative_trip_id",
            "p1,route,1,t1"
          ],
          "trips.txt" => [
            "route_id,service_id,trip_id,trip_headsign,direction_id,block_id,route_pattern_id,shape_id",
            "route,service,t1,h1,1,b,route-_-0,shape"
          ],
          "stop_times.txt" => [
            "trip_id,arrival_time,departure_time,stop_id,stop_sequence,checkpoint_id",
            "t1,,00:00:01,s4,1,exurb"
          ],
          "shapes.txt" => [
            "shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled",
            "shape,42.373178,-71.118170,0,"
          ]
        })

      assert Gtfs.shape("route", pid) == nil
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
