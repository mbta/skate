defmodule ScheduleTest do
  use ExUnit.Case

  import Test.Support.Helpers

  alias Schedule.Trip
  alias Schedule.Gtfs.{Route, RoutePattern, Shape, Stop, StopTime, Timepoint}
  alias Schedule.Gtfs.Shape.Point

  describe "all_routes" do
    test "maps each row to a Route" do
      pid =
        Schedule.start_mocked(%{
          gtfs: %{
            "directions.txt" => [
              "route_id,direction_id,direction,direction_destination",
              "39,0,Outbound,Forest Hills",
              "39,1,Inbound,Back Bay Station"
            ],
            "routes.txt" => [
              "route_id,route_long_name,route_type,route_desc,route_short_name",
              "39,Forest Hills - Back Bay Station,3,Key Bus,39"
            ]
          }
        })

      assert Schedule.all_routes(pid) == [
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
        Schedule.start_mocked(%{
          gtfs: %{
            "routes.txt" => [
              "route_id,route_long_name,route_type,route_short_name",
              "Red,Red Line,1,",
              "39,Forest Hills - Back Bay Station,3,39"
            ]
          }
        })

      refute Enum.any?(Schedule.all_routes(pid), &(&1.id == "Red"))
    end
  end

  describe "timepoints_on_route" do
    test "returns all of the timepoints for route patterns on this route" do
      pid =
        Schedule.start_mocked(%{
          gtfs: %{
            "checkpoints.txt" => [
              "checkpoint_id,checkpoint_name",
              "check,Check Name",
              "other,Other Name"
            ],
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
          }
        })

      assert Schedule.timepoints_on_route("39", pid) == [
               %Timepoint{id: "check", name: "Check Name"}
             ]
    end

    test "filters out non-bus trips, route patterns, and timepoints" do
      pid =
        Schedule.start_mocked(%{
          gtfs: %{
            "checkpoints.txt" => [
              "checkpoint_id,checkpoint_name",
              "check,Check Name"
            ],
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
          }
        })

      assert Schedule.timepoints_on_route("39", pid) == [
               %Timepoint{id: "check", name: "Check Name"}
             ]

      assert Schedule.timepoints_on_route("Blue", pid) == []
    end

    test "merges multiple trips into a coherent order" do
      pid =
        Schedule.start_mocked(%{
          gtfs: %{
            "checkpoints.txt" => [
              "checkpoint_id,checkpoint_name",
              "check,Check Name",
              "c1,c1 name",
              "c2,c2 name",
              "c4,c4 name",
              "c5,c5 name",
              "c2,c2 name",
              "c3,c3 name",
              "c4,c4 name"
            ],
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
          }
        })

      assert Schedule.timepoints_on_route("route", pid) == [
               %Timepoint{id: "c1", name: "c1 name"},
               %Timepoint{id: "c2", name: "c2 name"},
               %Timepoint{id: "c3", name: "c3 name"},
               %Timepoint{id: "c4", name: "c4 name"},
               %Timepoint{id: "c5", name: "c5 name"}
             ]
    end

    test "merges stops from both directions, flipping direction 0" do
      pid =
        Schedule.start_mocked(%{
          gtfs: %{
            "checkpoints.txt" => [
              "checkpoint_id,checkpoint_name",
              "downtown,downtown name",
              "suburb,suburb name",
              "exurb,exurb name",
              "suburb,suburb name"
            ],
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
          }
        })

      assert Schedule.timepoints_on_route("route", pid) == [
               %Timepoint{id: "exurb", name: "exurb name"},
               %Timepoint{id: "suburb", name: "suburb name"},
               %Timepoint{id: "downtown", name: "downtown name"}
             ]
    end

    test "gracefully returns [] for route without timepoints" do
      pid =
        Schedule.start_mocked(%{
          gtfs: %{
            "route_patterns.txt" => [
              "route_pattern_id,route_id,direction_id,representative_trip_id",
              "pattern,route,0,trip"
            ],
            "stop_times.txt" => [
              "trip_id,arrival_time,departure_time,stop_sequence,checkpoint_id",
              "trip,,00:00:01,0,"
            ]
          }
        })

      assert Schedule.timepoints_on_route("route", pid) == []
    end
  end

  describe "stop/2" do
    test "returns the stop for this stop ID" do
      pid =
        Schedule.start_mocked(%{
          gtfs: %{
            "stops.txt" => [
              "stop_id,stop_name,stop_lat,stop_lon,parent_station",
              "1,One,1.0,1.5,",
              "2,Two,2.0,2.5,3"
            ]
          }
        })

      assert Schedule.stop("2", pid) == %Stop{
               id: "2",
               name: "Two",
               parent_station_id: "3",
               latitude: 2.0,
               longitude: 2.5
             }
    end

    test "returns nil if stop doesn't exist" do
      pid = Schedule.start_mocked(%{})
      assert Schedule.stop("id", pid) == nil
    end
  end

  describe "trip" do
    test "returns the trip, including stop_times" do
      pid =
        Schedule.start_mocked(%{
          gtfs: %{
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
          }
        })

      assert Schedule.trip("t1", pid) ==
               %Trip{
                 id: "t1",
                 route_id: "route",
                 block_id: "b",
                 service_id: "service",
                 headsign: "h1",
                 direction_id: 1,
                 route_pattern_id: "route-_-0",
                 shape_id: "shape1",
                 stop_times: [
                   %StopTime{
                     stop_id: "s4",
                     time: 1,
                     timepoint_id: "exurb"
                   },
                   %StopTime{stop_id: "s5", time: 2, timepoint_id: nil},
                   %StopTime{
                     stop_id: "s3",
                     time: 3,
                     timepoint_id: "suburb"
                   }
                 ]
               }
    end

    test "returns nil if the trip doesn't exist" do
      pid = Schedule.start_mocked(%{})
      assert Schedule.trip("t1", pid) == nil
    end

    test "includes run from hastus" do
      pid =
        Schedule.start_mocked(%{
          gtfs: %{
            "routes.txt" => [
              "route_id,route_type,route_short_name",
              "route,3,route"
            ],
            "route_patterns.txt" => [
              "route_pattern_id,route_id,direction_id,representative_trip_id",
              "pattern,route,1,trip"
            ],
            "trips.txt" => [
              "route_id,service_id,trip_id,trip_headsign,direction_id,block_id,route_pattern_id,shape_id",
              "route,service,trip,heasign,1,block,route-_-0,shape"
            ],
            "stop_times.txt" => [
              "trip_id,arrival_time,departure_time,stop_id,stop_sequence,checkpoint_id",
              "trip,,00:00:02,stop,1,"
            ]
          },
          hastus: %{
            "trips.csv" => [
              "schedule_id;area;run_id;block_id;start_time;end_time;start_place;end_place;route_id;trip_id",
              "aba20021;123;    1501;block;04:30;05:05;wtryd;hayms;route;trip"
            ]
          }
        })

      assert Schedule.trip("trip", pid).run_id == "123-1501"
    end
  end

  describe "block" do
    test "returns the list of trips on the block" do
      pid =
        Schedule.start_mocked(%{
          gtfs: %{
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
          }
        })

      assert Schedule.block("b", "service", pid) == [
               %Trip{
                 id: "t1",
                 route_id: "route",
                 block_id: "b",
                 service_id: "service",
                 # Shuttles do not have route_pattern_ids
                 headsign: "h1",
                 direction_id: 1,
                 route_pattern_id: "route-_-0",
                 shape_id: "shape1",
                 stop_times: [
                   %StopTime{
                     stop_id: "s4",
                     time: 1,
                     timepoint_id: "exurb"
                   },
                   %StopTime{stop_id: "s5", time: 2, timepoint_id: nil},
                   %StopTime{
                     stop_id: "s3",
                     time: 3,
                     timepoint_id: "suburb"
                   }
                 ]
               }
             ]
    end

    test "returns nil if the block doesn't exist" do
      pid = Schedule.start_mocked(%{})
      assert Schedule.block("b", "service", pid) == nil
    end
  end

  describe "active_trips" do
    test "returns trips that are active right now" do
      pid =
        Schedule.start_mocked(%{
          gtfs: %{
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
          }
        })

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800

      assert [%Trip{id: "now"}] = Schedule.active_trips(time0 + 2, time0 + 2, pid)
    end
  end

  describe "active_blocks" do
    test "returns only blocks that are active" do
      pid =
        Schedule.start_mocked(%{
          gtfs: %{
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
          }
        })

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800

      assert %{~D[2019-01-01] => [[%Trip{id: "now", block_id: "now"}]]} =
               Schedule.active_blocks(time0 + 1, time0 + 3, pid)
    end
  end

  describe "shapes" do
    test "returns the shapes for all trips corresponding to the requested route" do
      pid =
        Schedule.start_mocked(%{
          gtfs: %{
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
          }
        })

      assert Schedule.shapes("route", pid) == [
               %Shape{
                 id: "shape1",
                 points: [
                   %Point{
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
                   %Point{
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
        Schedule.start_mocked(%{
          gtfs: %{
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
          }
        })

      assert Schedule.shapes("route", pid) == [
               %Shape{
                 id: "shape1",
                 points: [
                   %Point{
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
        Schedule.start_mocked(%{
          gtfs: %{
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
          }
        })

      assert Schedule.shapes("route", pid) == [
               %Shape{
                 id: "shape",
                 points: [
                   %Point{
                     shape_id: "shape",
                     lat: 41.373178,
                     lon: -71.118170,
                     sequence: 0
                   },
                   %Point{
                     shape_id: "shape",
                     lat: 42.373178,
                     lon: -72.118170,
                     sequence: 1
                   },
                   %Point{
                     shape_id: "shape",
                     lat: 43.373178,
                     lon: -73.118170,
                     sequence: 2
                   }
                 ]
               }
             ]
    end
  end

  describe "shape_for_trip" do
    test "returns the shape for the trip" do
      pid =
        Schedule.start_mocked(%{
          gtfs: %{
            "routes.txt" => [
              "route_id,route_type,route_short_name,route_desc",
              "route,3,route,\"Key Bus\""
            ],
            "route_patterns.txt" => [
              "route_pattern_id,route_id,direction_id,representative_trip_id",
              "p1,route,1,trip"
            ],
            "trips.txt" => [
              "route_id,service_id,trip_id,trip_headsign,direction_id,block_id,route_pattern_id,shape_id",
              "route,service,trip,headsign,1,block,route-_-0,shape"
            ],
            "stop_times.txt" => [
              "trip_id,arrival_time,departure_time,stop_id,stop_sequence,checkpoint_id",
              "trip,,00:00:01,stop,1,"
            ],
            "shapes.txt" => [
              "shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled",
              "shape,42.373178,-71.118170,0,"
            ]
          }
        })

      assert Schedule.shape_for_trip("trip", pid) ==
               %Shape{
                 id: "shape",
                 points: [
                   %Point{
                     shape_id: "shape",
                     lat: 42.373178,
                     lon: -71.118170,
                     sequence: 0
                   }
                 ]
               }
    end
  end

  describe "first_route_pattern_for_route_and_direction" do
    test "returns the first route pattern matching the route and direction" do
      pid =
        Schedule.start_mocked(%{
          gtfs: %{
            "directions.txt" => [
              "route_id,direction_id,direction,direction_destination",
              "Shuttle-BabcockBostonCollege,0,West,Boston College",
              "Shuttle-BabcockBostonCollege,1,East,Park Street"
            ],
            "routes.txt" => [
              "route_id,route_long_name,route_type,route_desc,route_short_name",
              "Shuttle-BabcockBostonCollege,Green Line B Shuttle,3,Rail Replacement Bus,"
            ],
            "route_patterns.txt" => [
              "route_pattern_id,route_id,direction_id,route_pattern_name,representative_trip_id",
              "Shuttle-BabcockBostonCollege-0-0,Shuttle-BabcockBostonCollege,0,Babcock Street - Boston College,41836966-20:45-BabcockBCNewtonHighlandsKenmore1",
              "Shuttle-BabcockBostonCollege-0-1,Shuttle-BabcockBostonCollege,1,Boston College - Babcock Street,41836965-20:45-BabcockBCNewtonHighlandsKenmore1"
            ],
            "trips.txt" => [
              "route_id,service_id,trip_id,trip_headsign,trip_short_name,direction_id,block_id,shape_id,wheelchair_accessible,trip_route_type,route_pattern_id,bikes_allowed",
              "Shuttle-BabcockBostonCollege,LRV419-1-Wdy-01-BbkBCNwnHgsKnr,41836966-20:45-BabcockBCNewtonHighlandsKenmore1,Boston College (Shuttle),,0,B813_-5-0-BabcockBC1,BabcockStreetToBostonCollege-S,1,3,Shuttle-BabcockBostonCollege-0-0,0",
              "Shuttle-BabcockBostonCollege,LRV419-1-Wdy-01-BbkBCNwnHgsKnr,41836965-20:45-BabcockBCNewtonHighlandsKenmore1,Babcock Street (Shuttle),,1,B813_-5-1-BabcockBC1,BostonCollegeToBabcockStreet-S,1,3,Shuttle-BabcockBostonCollege-0-1,0"
            ],
            "stop_times.txt" => [
              "trip_id,arrival_time,departure_time,stop_id,stop_sequence,stop_headsign,pickup_type,drop_off_type,timepoint,checkpoint_id",
              "41836966-20:45-BabcockBCNewtonHighlandsKenmore1,25:16:00,25:16:00,958,0,,0,1,,",
              "41836965-20:45-BabcockBCNewtonHighlandsKenmore1,24:11:00,24:11:00,9070107,0,,0,1,,"
            ]
          }
        })

      assert Schedule.first_route_pattern_for_route_and_direction(
               "Shuttle-BabcockBostonCollege",
               0,
               pid
             ) ==
               %RoutePattern{
                 id: "Shuttle-BabcockBostonCollege-0-0",
                 name: "Babcock Street - Boston College",
                 route_id: "Shuttle-BabcockBostonCollege",
                 direction_id: 0,
                 representative_trip_id: "41836966-20:45-BabcockBCNewtonHighlandsKenmore1"
               }
    end
  end

  describe "fetch_remote_files" do
    test "successfully loads empty data" do
      bypass = Bypass.open()
      gtfs_url = "http://localhost:#{bypass.port}/MBTA_GTFS.zip"
      hastus_url = "http://localhost:#{bypass.port}/hastus_skate_dev.zip"
      reassign_env(:skate, :gtfs_url, gtfs_url)
      reassign_env(:skate, :hastus_url, hastus_url)

      # empty zip file
      zip_binary =
        "UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA=="
        |> Base.decode64!()

      Bypass.expect(bypass, fn conn ->
        Plug.Conn.resp(conn, 200, zip_binary)
      end)

      assert {:files, _all_files} = Schedule.fetch_remote_files()
    end
  end

  describe "fetch_zip" do
    test "fetches and unzips zip file" do
      bypass = Bypass.open()
      url = "http://localhost:#{bypass.port}/test.zip"

      zip_binary =
        "UEsDBAoAAAAAAHJrSU+DFtyMAQAAAAEAAAABABwAZlVUCQADhxieXasYnl11eAsAAQT1AQAABBQAAAB4UEsBAh4DCgAAAAAAcmtJT4MW3IwBAAAAAQAAAAEAGAAAAAAAAQAAAKSBAAAAAGZVVAUAA4cYnl11eAsAAQT1AQAABBQAAABQSwUGAAAAAAEAAQBHAAAAPAAAAAAA"
        |> Base.decode64!()

      Bypass.expect(bypass, fn conn ->
        Plug.Conn.resp(conn, 200, zip_binary)
      end)

      assert Schedule.fetch_zip(url, ["f"]) == {:ok, %{"f" => "x"}}
    end
  end
end
