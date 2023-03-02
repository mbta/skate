defmodule Schedule.Hastus.TripTest do
  use ExUnit.Case, async: true

  alias Schedule.Hastus.Trip

  import Skate.Factory

  describe "parse" do
    test "parses data" do
      binary =
        [
          "schedule_id;area;run_id;block_id;start_time;end_time;start_place;end_place;route_id;trip_id",
          "aba20021;123;    1501; 57 - 11;04:30;05:05;wtryd;hayms;  193;   43857919"
        ]
        |> Enum.join("\n")

      assert Trip.parse(binary) == [
               %Trip{
                 schedule_id: "aba20021",
                 run_id: "123-1501",
                 block_id: "57-11",
                 start_time: 16200,
                 end_time: 18300,
                 start_place: "wtryd",
                 end_place: "hayms",
                 route_id: "193",
                 trip_id: "43857919"
               }
             ]
    end

    test "applies mapping to places" do
      binary =
        [
          "schedule_id;area;run_id;block_id;start_time;end_time;start_place;end_place;route_id;trip_id",
          "abb11011;122;    1002;B33-124;05:15;05:23;dudly;fhill;   42;   46654658",
          "abb11011;122;    1002;B33-124;05:30;05:39;fhill;dudly;   42;   46654716"
        ]
        |> Enum.join("\n")

      assert Trip.parse(binary) == [
               %Trip{
                 schedule_id: "abb11011",
                 run_id: "122-1002",
                 block_id: "B33-124",
                 start_time: 18900,
                 end_time: 19380,
                 start_place: "nubn",
                 end_place: "fhill",
                 route_id: "42",
                 trip_id: "46654658"
               },
               %Trip{
                 schedule_id: "abb11011",
                 run_id: "122-1002",
                 block_id: "B33-124",
                 start_time: 19800,
                 end_time: 20340,
                 start_place: "fhill",
                 end_place: "nubn",
                 route_id: "42",
                 trip_id: "46654716"
               }
             ]
    end

    test "filters out malformed rows" do
      binary =
        [
          "schedule_id;area;run_id;block_id;start_time;end_time;start_place;end_place;route_id;trip_id",
          ";;;      T3;25:37;25:47;orhgt;prwb;;   43365492"
        ]
        |> Enum.join("\n")

      assert Trip.parse(binary) == []
    end

    test "parses deadheads with null route" do
      binary =
        [
          "schedule_id;area;run_id;block_id;start_time;end_time;start_place;end_place;route_id;trip_id",
          "aba20021;123;    1501; pull;04:15;04:30;albny;wtryd;;   43858890",
          "aba20021;123;    1501; pull;04:15;04:30;albny;wtryd; pull;   43858890"
        ]
        |> Enum.join("\n")

      assert [
               %Trip{
                 route_id: nil
               },
               %Trip{
                 route_id: nil
               }
             ] = Trip.parse(binary)
    end
  end

  describe "expand_through_routed_trips/2" do
    test "replaces a single consolidated through_routed trip with multiple differentiated trips" do
      hastus_trip1 = build(:hastus_trip, trip_id: "nonthrough_routed")
      hastus_trip2 = build(:hastus_trip, trip_id: "through_routed")
      gtfs_trip_ids = ["nonthrough_routed", "through_routed_1", "through_routed_2"]

      result =
        [hastus_trip1, hastus_trip2]
        |> Trip.expand_through_routed_trips(gtfs_trip_ids)

      assert result == [
               hastus_trip1,
               %Trip{hastus_trip2 | trip_id: "through_routed_1"},
               %Trip{hastus_trip2 | trip_id: "through_routed_2"}
             ]
    end
  end
end
