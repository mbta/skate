defmodule Gtfs.RunTest do
  use ExUnit.Case

  alias Gtfs.Run

  describe "run_ids_by_trip_id" do
    test "run_ids_by_trip_id" do
      binary =
        [
          "schedule_id;area;run_id;route_id;trip_id;block_id",
          ";;;;   41928906;424 - 61",
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
  end
end
