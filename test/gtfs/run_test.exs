defmodule Gtfs.RunTest do
  use ExUnit.Case

  alias Gtfs.Run

  describe "run_ids_by_trip_id" do
    test "run_ids_by_trip_id" do
      binary =
        [
          "schedule_id;area;run_id;route_id;trip_id;block_id",
          "aba49011;123;    1501;  553;   41819716;553 -140",
          "aba49011;123;    1501;  553;   41819715;553 -140",
          "aba49011;123;    1502;  193;   41820107; 57 - 12"
        ]
        |> Enum.join("\n")

      assert Run.run_ids_by_trip_id(binary) == %{
               "41819716" => "123-1501",
               "41819715" => "123-1501",
               "41820107" => "123-1502"
             }
    end

    test "filters out rows with missing data" do
      binary =
        [
          "schedule_id;area;run_id;route_id;trip_id;block_id",
          ";;;;   41928906;424 - 61"
        ]
        |> Enum.join("\n")

      assert Run.run_ids_by_trip_id(binary) == %{}
    end
  end

  describe "run_id_for_trip_id_from_row" do
    test "combines area and run into a longer run" do
      assert Run.run_id_for_trip_id_from_row(%{
               "area" => "123",
               "run_id" => "1501",
               "trip_id" => "41819716"
             }) == {"41819716", "123-1501"}
    end

    test "pads 3 digit runs into 4 digit" do
      assert Run.run_id_for_trip_id_from_row(%{
               "area" => "123",
               "run_id" => "456",
               "trip_id" => "41819716"
             }) == {"41819716", "123-0456"}
    end
  end
end
