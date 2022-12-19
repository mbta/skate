defmodule ScheduleTest do
  use ExUnit.Case

  alias Schedule.{Block, Trip, Swing}
  alias Schedule.Gtfs.{Route, RoutePattern, Shape, Stop, StopTime, Timepoint}
  alias Schedule.Gtfs.Shape.Point
  alias Schedule.Piece
  alias Schedule.Run

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
          },
          hastus: %{
            "trips.csv" => [
              "schedule_id;area;run_id;block_id;start_time;end_time;start_place;end_place;route_id;trip_id",
              "schedule;123;    1501;b;04:30;05:05;wtryd;hayms;route;t1"
            ]
          }
        })

      assert Schedule.trip("t1", pid) ==
               %Trip{
                 id: "t1",
                 block_id: "b",
                 route_id: "route",
                 service_id: "service",
                 headsign: "h1",
                 direction_id: 1,
                 route_pattern_id: "route-_-0",
                 shape_id: "shape1",
                 schedule_id: "schedule",
                 run_id: "123-1501",
                 start_time: 1,
                 end_time: 3,
                 start_place: "wtryd",
                 end_place: "hayms",
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
          },
          hastus: %{
            "activities.csv" => [
              "schedule_id;area;run_id;start_time;end_time;start_place;end_place;activity_type;activity_name",
              "schedule;123;1501;04:20;05:15;start;end;Operator;b"
            ],
            "trips.csv" => [
              "schedule_id;area;run_id;block_id;start_time;end_time;start_place;end_place;route_id;trip_id",
              "schedule;123;    1501;b;04:30;05:05;wtryd;hayms;route;t1"
            ]
          }
        })

      assert %Block{
               id: "b",
               service_id: "service",
               schedule_id: "schedule",
               start_time: 15600,
               end_time: 18900,
               pieces: [
                 %Piece{
                   schedule_id: "schedule",
                   run_id: "123-1501",
                   block_id: "b",
                   trips: [
                     %Trip{id: "t1"}
                   ]
                 }
               ]
             } = Schedule.block("schedule", "b", pid)
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
          },
          hastus: %{
            "activities.csv" => [
              "schedule_id;area;run_id;start_time;end_time;start_place;end_place;activity_type;activity_name",
              "schedule;123;456;00:01;12:01;start;end;Operator;now"
            ],
            "trips.csv" => [
              "schedule_id;area;run_id;block_id;start_time;end_time;start_place;end_place;route_id;trip_id",
              "schedule;123;456;now;00:01;12:01;someplace;otherplace;route;now"
            ]
          }
        })

      # 2019-01-01 00:00:00 EST
      time0 = 1_546_318_800

      assert %{~D[2019-01-01] => [%Block{id: "now"}]} =
               Schedule.active_blocks(time0 + 1, time0 + 90, pid)
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

  describe "shape_with_stops_for_trip" do
    test "returns the shape with stops for the trip" do
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
              "trip,,00:00:01,stop1_id,1,"
            ],
            "stops.txt" => [
              "stop_id,stop_name,stop_lat,stop_lon,parent_station",
              "stop1_id,One,1.0,1.5,"
            ],
            "shapes.txt" => [
              "shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled",
              "shape,42.373178,-71.118170,0,"
            ]
          }
        })

      assert  %Schedule.ShapeWithStops{
                 id: "shape",
                 points: [
                   %Point{
                     shape_id: "shape",
                     lat: 42.373178,
                     lon: -71.118170,
                     sequence: 0
                   }
                 ],
                 stops: [
                   %Stop{id: "stop1_id", name: "One", latitude: 1.0, longitude: 1.5}
                 ]
               } = Schedule.shape_with_stops_for_trip("trip", pid)

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

  describe "blocks and runs by trip" do
    setup do
      pid =
        Schedule.start_mocked(%{
          hastus: %{
            "activities.csv" => [
              "schedule_id;area;run_id;start_time;end_time;start_place;end_place;activity_type;activity_name",
              "schedule;123;4567;00:00;00:00;start;end;Operator;block"
            ],
            "trips.csv" => [
              "schedule_id;area;run_id;block_id;start_time;end_time;start_place;end_place;route_id;trip_id",
              "schedule;123;4567;block;00:00;00:00;start;end;route;trip"
            ]
          },
          gtfs: %{
            "checkpoints.txt" => [
              "checkpoint_id,checkpoint_name",
              "start,Starting Timepoint",
              "end,Ending Timepoint"
            ],
            "routes.txt" => [
              "route_id,route_long_name,route_type,route_desc,route_short_name",
              "route,Some Place - Some Other Place,3,Key Bus,route"
            ],
            "trips.txt" => [
              "route_id,service_id,trip_id,trip_headsign,direction_id,block_id",
              "route,service,trip,Headsign,0,block",
              "route,service,trip,Headsign,1,block"
            ],
            "stop_times.txt" => [
              "trip_id,arrival_time,departure_time,stop_sequence,checkpoint_id",
              "trip,,00:00:00,1,start",
              "trip,,00:00:00,2,"
            ]
          }
        })

      expected_piece = %Piece{
        schedule_id: "schedule",
        run_id: "123-4567",
        block_id: "block",
        start_time: 0,
        start_place: "Starting Timepoint",
        trips: [
          %Schedule.Trip{
            id: "trip",
            block_id: "block",
            route_id: "route",
            run_id: "123-4567",
            start_time: 0,
            end_time: 0,
            start_place: "start",
            end_place: "end",
            schedule_id: "schedule",
            service_id: "service",
            pretty_start_place: "Starting Timepoint",
            pretty_end_place: "Ending Timepoint",
            direction_id: 1,
            headsign: "Headsign",
            stop_times: [
              %Schedule.Gtfs.StopTime{stop_id: nil, time: 0, timepoint_id: "start"},
              %Schedule.Gtfs.StopTime{stop_id: nil, time: 0, timepoint_id: nil}
            ]
          }
        ],
        end_time: 0,
        end_place: "Ending Timepoint"
      }

      %{pid: pid, expected_piece: expected_piece}
    end

    test "can get run via run_for_trip", %{pid: pid, expected_piece: expected_piece} do
      assert Schedule.run_for_trip("123-4567", "trip", pid) ==
               %Run{
                 schedule_id: "schedule",
                 service_id: "service",
                 id: "123-4567",
                 activities: [
                   expected_piece
                 ]
               }
    end

    test "can get block", %{pid: pid, expected_piece: expected_piece} do
      assert %Block{
               schedule_id: "schedule",
               id: "block",
               pieces: [^expected_piece]
             } = Schedule.block_for_trip("trip", pid)
    end
  end

  describe "swings_for_route/4" do
    setup do
      pid =
        Schedule.start_mocked(%{
          hastus: %{
            "activities.csv" => [
              "schedule_id;area;run_id;start_time;end_time;start_place;end_place;activity_type;activity_name",
              "schedule;123;456;00:00;00:00;start;end;Operator;block",
              "schedule;123;789;00:00;00:00;start;end;Operator;block"
            ],
            "trips.csv" => [
              "schedule_id;area;run_id;block_id;start_time;end_time;start_place;end_place;route_id;trip_id",
              "schedule;123;456;block;00:00;00:00;start;end;route;trip1",
              "schedule;123;789;block;00:00;00:00;start;end;route;trip2"
            ]
          },
          gtfs: %{
            "calendar.txt" => [
              "service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date",
              "service,1,0,0,0,0,0,0,20210419,20210419"
            ],
            "checkpoints.txt" => [
              "checkpoint_id,checkpoint_name",
              "start,Starting Timepoint",
              "end,Ending Timepoint"
            ],
            "routes.txt" => [
              "route_id,route_long_name,route_type,route_desc,route_short_name",
              "route,Some Place - Some Other Place,3,Key Bus,route"
            ],
            "stop_times.txt" => [
              "trip_id,arrival_time,departure_time,stop_sequence,checkpoint_id",
              "trip1,,00:00:00,1,start",
              "trip2,,00:00:00,2,"
            ],
            "trips.txt" => [
              "route_id,service_id,trip_id,trip_headsign,direction_id,block_id",
              "route,service,trip1,Headsign,0,block",
              "route,service,trip2,Headsign,1,block"
            ]
          }
        })

      expected_swing = %Swing{
        block_id: "block",
        from_route_id: "route",
        from_run_id: "123-0456",
        from_trip_id: "trip1",
        to_route_id: "route",
        to_run_id: "123-0789",
        to_trip_id: "trip2",
        time: 0
      }

      %{
        pid: pid,
        expected_swing: expected_swing,
        route_id: "route",
        start_time: 1_618_848_000,
        end_time: 1_618_848_000
      }
    end

    test "can get swing", %{
      pid: pid,
      expected_swing: expected_swing,
      route_id: route_id,
      start_time: start_time,
      end_time: end_time
    } do
      assert Schedule.swings_for_route(route_id, start_time, end_time, pid) == [expected_swing]
    end
  end
end
