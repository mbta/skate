defmodule Schedule.Hastus.ActivityTest do
  use ExUnit.Case

  alias Schedule.Hastus.Activity

  describe "parse" do
    test "parses data" do
      binary =
        [
          "schedule_id;area;run_id;start_time;end_time;start_place;end_place;activity_name;activity_type",
          "aba20021;123;    1501;04:05;04:15;albny;albny;Sign-on;Sign-on"
        ]
        |> Enum.join("\n")

      assert Activity.parse(binary) == [
               %Activity{
                 schedule_id: "aba20021",
                 run_id: "123-1501",
                 start_time: 14700,
                 end_time: 15300,
                 start_place: "albny",
                 end_place: "albny",
                 activity_type: "Sign-on",
                 partial_block_id: nil
               }
             ]
    end

    test "fills block id for Operator activities, without extra whitespace" do
      binary =
        [
          "schedule_id;area;run_id;start_time;end_time;start_place;end_place;activity_name;activity_type",
          "aba20021;123;    1501;04:15;09:29;albny;albny; 57 - 11;Operator"
        ]
        |> Enum.join("\n")

      assert Activity.parse(binary) == [
               %Activity{
                 schedule_id: "aba20021",
                 run_id: "123-1501",
                 start_time: 15300,
                 end_time: 34140,
                 start_place: "albny",
                 end_place: "albny",
                 activity_type: "Operator",
                 partial_block_id: "57-11"
               }
             ]
    end
  end
end
