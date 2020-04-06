defmodule Static.Hastus.TripTest do
  use ExUnit.Case

  alias Static.Hastus.Trip

  describe "parse" do
    test "parses data" do
      binary =
        [
          "schedule_id;area;run_id;block_id;start_time;end_time;start_place;end_place;route_id;trip_id",
          "aba20021;123;    1501; 57 - 11;04:15;04:30;albny;wtryd;;   43858890",
          "aba20021;123;    1501; 57 - 11;04:30;05:05;wtryd;hayms;  193;   43857919"
        ]
        |> Enum.join("\n")

      assert Trip.parse(binary) == [
               %Trip{
                 schedule_id: "aba20021",
                 run_id: "123-1501",
                 block_id: "57-11",
                 start_time: 15300,
                 end_time: 16200,
                 start_place: "albny",
                 end_place: "wtryd",
                 route_id: nil,
                 trip_id: "43858890"
               },
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

    test "filters out malformed rows" do
      binary =
        [
          "schedule_id;area;run_id;block_id;start_time;end_time;start_place;end_place;route_id;trip_id",
          ";;;      T3;25:37;25:47;orhgt;prwb;;   43365492"
        ]
        |> Enum.join("\n")

      assert Trip.parse(binary) == []
    end

    test "0 pads short run ids" do
      binary =
        [
          "schedule_id;area;run_id;block_id;start_time;end_time;start_place;end_place;route_id;trip_id",
          "aba20021;123;     501; 57 - 11;04:15;04:30;albny;wtryd;;   43858890"
        ]
        |> Enum.join("\n")

      assert binary
             |> Trip.parse()
             |> Enum.at(0)
             |> (fn trip -> trip.run_id end).() ==
               "123-0501"
    end
  end
end
