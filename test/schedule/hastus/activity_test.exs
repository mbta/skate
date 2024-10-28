defmodule Schedule.Hastus.ActivityTest do
  use ExUnit.Case, async: true

  alias Schedule.Hastus.Activity

  describe "parse" do
    test "parses data" do
      binary =
        Enum.join(
          [
            "schedule_id;area;run_id;start_time;end_time;start_place;end_place;activity_name;activity_type",
            "aba20021;123;    1501;04:05;04:15;albny;albny;Sign-on;Sign-on"
          ],
          "\n"
        )

      assert Activity.parse(binary) == [
               %Activity{
                 schedule_id: "aba20021",
                 run_id: "123-1501",
                 start_time: 14_700,
                 end_time: 15_300,
                 start_place: "albny",
                 end_place: "albny",
                 activity_type: "Sign-on",
                 partial_block_id: nil
               }
             ]
    end

    test "applies mapping to places" do
      binary =
        Enum.join(
          [
            "schedule_id;area;run_id;start_time;end_time;start_place;end_place;activity_name;activity_type",
            "abc11011;123;    1023;11:37;11:38;dudly;dudly;Sign-on;Sign-on"
          ],
          "\n"
        )

      assert Activity.parse(binary) == [
               %Activity{
                 schedule_id: "abc11011",
                 run_id: "123-1023",
                 start_time: 41_820,
                 end_time: 41_880,
                 start_place: "nubn",
                 end_place: "nubn",
                 activity_type: "Sign-on",
                 partial_block_id: nil
               }
             ]
    end

    test "fills block id for Operator activities, without extra whitespace" do
      binary =
        Enum.join(
          [
            "schedule_id;area;run_id;start_time;end_time;start_place;end_place;activity_name;activity_type",
            "aba20021;123;    1501;04:15;09:29;albny;albny; 57 - 11;Operator"
          ],
          "\n"
        )

      assert Activity.parse(binary) == [
               %Activity{
                 schedule_id: "aba20021",
                 run_id: "123-1501",
                 start_time: 15_300,
                 end_time: 34_140,
                 start_place: "albny",
                 end_place: "albny",
                 activity_type: "Operator",
                 partial_block_id: "57-11"
               }
             ]
    end
  end
end
