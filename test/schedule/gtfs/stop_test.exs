defmodule Schedule.Gtfs.StopTest do
  use ExUnit.Case, async: true

  alias Schedule.Gtfs.{Route, RoutePattern, Stop, StopTime}

  @csv_row %{
    "stop_id" => "1",
    "stop_code" => "1",
    "stop_name" => "Washington St opp Ruggles St",
    "stop_desc" => "",
    "platform_code" => "",
    "platform_name" => "",
    "stop_lat" => "42.330957",
    "stop_lon" => "-71.082754",
    "zone_id" => "",
    "stop_address" => "",
    "stop_url" => "https://www.mbta.com/stops/1",
    "level_id" => "",
    "location_type" => "1",
    "parent_station" => "place-asmnl",
    "wheelchair_boarding" => "1"
  }

  describe "parse/1" do
    test "returns only stops and stations" do
      file =
        Enum.join(
          [
            "stop_id,stop_name,stop_lat,stop_lon,parent_station,location_type,vehicle_type",
            "stop-1,No Location Type,1.0,1.5,,,3",
            "stop-2,Stop,2.0,2.5,,0,3",
            "stop-3,Platform,2.0,2.5,stop-4,0,3",
            "stop-4,Station,2.0,2.5,,1,",
            "stop-5,Enterance,2.0,2.5,,2,",
            "stop-6,Generic Node,2.0,2.5,,3,",
            "stop-7,Boarding Area,2.0,2.5,,4,"
          ],
          "\n"
        )

      assert [
               %Stop{
                 id: "stop-1",
                 name: "No Location Type",
                 location_type: :stop,
                 parent_station_id: nil,
                 vehicle_type: 3
               },
               %Stop{id: "stop-2", name: "Stop", location_type: :stop, parent_station_id: nil},
               %Stop{
                 id: "stop-3",
                 name: "Platform",
                 location_type: :stop,
                 parent_station_id: "stop-4",
                 vehicle_type: 3
               },
               %Stop{
                 id: "stop-4",
                 name: "Station",
                 location_type: :station,
                 parent_station_id: nil,
                 vehicle_type: nil
               }
             ] = Stop.parse(file)
    end
  end

  describe "parent_station_id/1" do
    test "returns the parent_station_id if the stop has one" do
      stop = %Stop{
        id: "1",
        name: "name",
        parent_station_id: "2"
      }

      assert Stop.parent_station_id(stop) == "2"
    end

    test "returns the id of this stop if parent_station_id is nil" do
      stop = %Stop{
        id: "1",
        name: "name",
        parent_station_id: nil
      }

      assert Stop.parent_station_id(stop) == "1"
    end

    test "returns nil if given nil" do
      assert Stop.parent_station_id(nil) == nil
    end
  end

  describe "from_csv_row/1" do
    test "builds a trip stops map from a list of stop time csv rows" do
      assert Stop.from_csv_row(@csv_row) == %Stop{
               id: "1",
               name: "Washington St opp Ruggles St",
               parent_station_id: "place-asmnl",
               latitude: 42.330957,
               longitude: -71.082754,
               location_type: :station
             }
    end

    test "tolerates missing optional fields" do
      assert Stop.from_csv_row(
               @csv_row
               |> Map.put("parent_station", "")
               |> Map.put("stop_lat", "")
               |> Map.put("stop_lon", "")
               |> Map.put("location_type", "")
             ) == %Stop{
               id: "1",
               name: "Washington St opp Ruggles St",
               parent_station_id: nil,
               latitude: nil,
               longitude: nil,
               location_type: :stop
             }
    end
  end

  describe "is_station?/1" do
    test "true when location_type is :station" do
      assert Stop.is_station?(%Stop{id: "stop-1", name: "Station", location_type: :station})
    end

    test "false when location_type is :stop" do
      refute Stop.is_station?(%Stop{id: "stop-1", name: "Stop", location_type: :stop})
    end
  end

  describe "stops_with_routes/4" do
    setup do
      %{
        stop_1: %Stop{id: 1, name: "stop 1", parent_station_id: nil},
        stop_2: %Stop{id: 2, name: "stop 2", parent_station_id: nil},
        parent_stop: %Stop{id: 3, name: "parent stop", parent_station_id: nil},
        child_stop_1: %Stop{id: 4, name: "child stop 1", parent_station_id: 3},
        child_stop_2: %Stop{id: 5, name: "child stop 2", parent_station_id: 3},
        route_1: %Route{
          id: "route_1",
          name: "route 1 Name",
          description: "route 1 desc",
          direction_names: %{}
        },
        route_2: %Route{
          id: "route_2",
          name: "route 2 Name",
          description: "route 2 desc",
          direction_names: %{}
        },
        shuttle_route: %Route{
          id: "shuttle_route",
          name: "Shuttle Route Name",
          description: "Rail Replacement Bus",
          direction_names: %{}
        },
        route_1_pattern_1: %RoutePattern{
          id: "rp1",
          name: "pattern 1",
          route_id: "route_1",
          direction_id: 1,
          representative_trip_id: "trip_1"
        },
        route_1_pattern_2: %RoutePattern{
          id: "rp1_variant",
          name: "route 1 variant",
          route_id: "route_1",
          direction_id: 1,
          representative_trip_id: "trip_variant"
        },
        route_2_pattern_1: %RoutePattern{
          id: "rp2",
          name: "pattern 2",
          route_id: "route_2",
          direction_id: 1,
          representative_trip_id: "trip_2"
        },
        shuttle_route_pattern_1: %RoutePattern{
          id: "srp",
          name: "shuttle pattern",
          route_id: "shuttle_route",
          direction_id: 1,
          representative_trip_id: "shuttle_trip"
        }
      }
    end

    test "routes is empty for a stop when no routes found", data do
      trip_id = data.route_1_pattern_1.representative_trip_id
      stop_id = data.stop_1.id

      assert %{^stop_id => %{routes: []}} =
               Stop.stops_with_routes(
                 %{stop_id => data.stop_1},
                 [data.route_1, data.route_2],
                 [data.route_1_pattern_1],
                 %{trip_id => [%StopTime{stop_id: data.stop_2.id, time: 60}]}
               )
    end

    test "only the routes that go to stop are included as a connection", data do
      stop_1_id = data.stop_1.id
      stop_2_id = data.stop_2.id

      route_1 = data.route_1
      route_2 = data.route_2

      route_1_trip_id = data.route_1_pattern_1.representative_trip_id
      route_2_trip_id = data.route_2_pattern_1.representative_trip_id

      assert %{
               ^stop_1_id => %{routes: [^route_1, ^route_2]},
               ^stop_2_id => %{routes: [^route_1]}
             } =
               Stop.stops_with_routes(
                 %{stop_1_id => data.stop_1, stop_2_id => data.stop_2},
                 [data.route_1, data.route_2],
                 [data.route_1_pattern_1, data.route_2_pattern_1],
                 %{
                   # Route 1 hits both stops
                   route_1_trip_id => [
                     %StopTime{stop_id: stop_1_id, time: 60},
                     %StopTime{stop_id: stop_2_id, time: 120}
                   ],
                   # Route 2 only stop 2
                   route_2_trip_id => [%StopTime{stop_id: stop_1_id, time: 180}]
                 }
               )
    end

    test "shuttle routes are excluded", data do
      stop_1_id = data.stop_1.id

      route_1 = data.route_1
      route_2 = data.shuttle_route

      route_1_trip_id = data.route_1_pattern_1.representative_trip_id
      route_2_trip_id = data.shuttle_route_pattern_1.representative_trip_id

      assert %{
               ^stop_1_id => %{routes: [^route_1]}
             } =
               Stop.stops_with_routes(
                 %{stop_1_id => data.stop_1},
                 [route_1, route_2],
                 [data.route_1_pattern_1, data.shuttle_route_pattern_1],
                 %{
                   route_1_trip_id => [%StopTime{stop_id: stop_1_id, time: 60}],
                   route_2_trip_id => [%StopTime{stop_id: stop_1_id, time: 180}]
                 }
               )
    end

    test "routes include routes that stop at sibling stops", data do
      sibling_stop_1_id = data.child_stop_1.id
      sibling_stop_2_id = data.child_stop_2.id

      route_1 = data.route_1
      route_2 = data.route_2

      route_1_trip_id = data.route_1_pattern_1.representative_trip_id
      route_2_trip_id = data.route_2_pattern_1.representative_trip_id

      assert %{
               ^sibling_stop_1_id => %{routes: [^route_1, ^route_2]},
               ^sibling_stop_2_id => %{routes: [^route_1, ^route_2]}
             } =
               Stop.stops_with_routes(
                 %{
                   sibling_stop_1_id => data.child_stop_1,
                   sibling_stop_2_id => data.child_stop_2
                 },
                 [data.route_1, data.route_2],
                 [data.route_1_pattern_1, data.route_2_pattern_1],
                 %{
                   # Route 1 hits only sibling 1 stop
                   route_1_trip_id => [
                     %StopTime{stop_id: sibling_stop_1_id, time: 60}
                   ],
                   # Route 2 hits only sibling 2 stop
                   route_2_trip_id => [%StopTime{stop_id: sibling_stop_2_id, time: 180}]
                 }
               )
    end

    test "routes include routes that stop at parent stops", data do
      child_stop_id = data.child_stop_1.id
      parent_stop_id = data.parent_stop.id

      route_1 = data.route_1
      route_2 = data.route_2

      route_1_trip_id = data.route_1_pattern_1.representative_trip_id
      route_2_trip_id = data.route_2_pattern_1.representative_trip_id

      assert %{
               ^child_stop_id => %{routes: [^route_1, ^route_2]},
               ^parent_stop_id => %{routes: [^route_1, ^route_2]}
             } =
               Stop.stops_with_routes(
                 %{child_stop_id => data.child_stop_1, parent_stop_id => data.parent_stop},
                 [data.route_1, data.route_2],
                 [data.route_1_pattern_1, data.route_2_pattern_1],
                 %{
                   # Route 1 hits only parent stop
                   route_1_trip_id => [
                     %StopTime{stop_id: parent_stop_id, time: 60}
                   ],
                   # Route 2 hits only child stop
                   route_2_trip_id => [%StopTime{stop_id: child_stop_id, time: 180}]
                 }
               )
    end

    test "routes are unique when multiple route patterns go to same stop", data do
      stop_1_id = data.stop_1.id

      route_1 = data.route_1

      route_1_trip_id_1 = data.route_1_pattern_1.representative_trip_id
      route_1_trip_id_2 = data.route_1_pattern_2.representative_trip_id

      assert %{
               ^stop_1_id => %{routes: [^route_1]}
             } =
               Stop.stops_with_routes(
                 %{stop_1_id => data.stop_1},
                 [data.route_1],
                 [data.route_1_pattern_1, data.route_1_pattern_2],
                 %{
                   # Both variants hit stop 1
                   route_1_trip_id_1 => [
                     %StopTime{stop_id: stop_1_id, time: 60}
                   ],
                   route_1_trip_id_2 => [%StopTime{stop_id: stop_1_id, time: 180}]
                 }
               )
    end
  end
end
