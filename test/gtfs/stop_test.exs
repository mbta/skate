defmodule Gtfs.StopTid do
  use ExUnit.Case, async: true

  alias Gtfs.Stop

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
    "location_type" => "0",
    "parent_station" => "",
    "wheelchair_boarding" => "1"
  }

  describe "parent_station_id/1" do
    test "returns the parent_station_id if the stop has one" do
      stop = %Stop{
        id: "1",
        parent_station_id: "2"
      }

      assert Stop.parent_station_id(stop) == "2"
    end

    test "returns the id of this stop if parent_station_id is nil" do
      stop = %Stop{
        id: "1",
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
               parent_station_id: nil
             }
    end
  end
end
