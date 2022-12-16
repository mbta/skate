defmodule Schedule.Gtfs.TripTest do
  use ExUnit.Case, async: true

  alias Schedule.Gtfs.Trip

  describe "from_csv_row" do
    test "builds a Trip struct from a csv row" do
      csv_row = %{
        "route_id" => "1",
        "service_id" => "BUS22019-hbc29011-Weekday-02",
        "trip_id" => "39914057",
        "trip_headsign" => "Harvard",
        "trip_short_name" => "",
        "direction_id" => "0",
        "block_id" => "C01-20",
        "shape_id" => "010070",
        "wheelchair_accessible" => "1",
        "trip_route_type" => "",
        "route_pattern_id" => "1-_-0",
        "bikes_allowed" => "1"
      }

      assert Trip.from_csv_row(csv_row) == %Trip{
               id: "39914057",
               route_id: "1",
               service_id: "BUS22019-hbc29011-Weekday-02",
               headsign: "Harvard",
               direction_id: 0,
               block_id: "C01-20",
               route_pattern_id: "1-_-0",
               shape_id: "010070"
             }
    end

    test "missing route_pattern_id is read as nil" do
      csv_row = %{
        "route_id" => "1",
        "service_id" => "BUS22019-hbc29011-Weekday-02",
        "trip_id" => "39914057",
        "trip_headsign" => "Harvard",
        "trip_short_name" => "",
        "direction_id" => "0",
        "block_id" => "C01-20",
        "shape_id" => "010070",
        "wheelchair_accessible" => "1",
        "trip_route_type" => "",
        "route_pattern_id" => "",
        "bikes_allowed" => "1"
      }

      assert %Trip{route_pattern_id: nil} = Trip.from_csv_row(csv_row)
    end
  end
end
