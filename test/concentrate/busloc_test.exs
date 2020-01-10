defmodule Concentrate.Parser.GTFSRealtimeEnhancedTest do
  use ExUnit.Case, async: true

  import Concentrate.TestHelpers

  alias Concentrate.Busloc

  describe "parse/1" do
    test "parsing a Busloc enhanced VehiclePositions JSON file returns only Busloc structs" do
      binary = File.read!(fixture_path("VehiclePositions_enhanced.json"))
      parsed = Busloc.parse(binary)
      assert is_list(parsed)

      for update <- parsed do
        assert update.__struct__ in [Busloc]
      end
    end
  end

  describe "decode_vehicle/1" do
    test "returns nothing if there's an empty map" do
      assert Busloc.decode_vehicle(%{}) == []
    end

    test "decodes a VehiclePosition JSON map" do
      input = %{
        "block_id" => "Q238-135",
        "congestion_level" => nil,
        "current_status" => "STOPPED_AT",
        "current_stop_sequence" => 670,
        "location_source" => "samsara",
        "occupancy_status" => nil,
        "operator" => %{"id" => "2841", "name" => "EVANS"},
        "position" => %{
          "bearing" => 135,
          "latitude" => 42.32951,
          "longitude" => -71.11109,
          "odometer" => 5.1,
          "speed" => 2.9796
        },
        "run_id" => "128-1007",
        "stop_id" => "70257",
        "timestamp" => 1_534_340_406,
        "trip" => %{
          "direction_id" => 0,
          "route_id" => "Green-E",
          "schedule_relationship" => "SCHEDULED",
          "start_date" => "20180815",
          "start_time" => nil,
          "trip_id" => "37165437-X"
        },
        "vehicle" => %{
          "id" => "G-10098",
          "label" => "3823-3605",
          "license_plate" => nil
        }
      }

      assert [vp] = Busloc.decode_vehicle(input)

      assert vp ==
               %Busloc{
                 id: "G-10098",
                 label: "3823-3605",
                 latitude: 42.32951,
                 longitude: -71.11109,
                 bearing: 135,
                 speed: 2.9796,
                 odometer: 5.1,
                 stop_id: "70257",
                 trip_id: "37165437-X",
                 stop_sequence: 670,
                 block_id: "Q238-135",
                 operator_id: "2841",
                 operator_name: "EVANS",
                 run_id: "128-1007",
                 current_status: :STOPPED_AT,
                 last_updated: 1_534_340_406
               }
    end
  end

  describe "date/1" do
    test "parses an epoch string" do
      assert Busloc.date("20190517") == {2019, 5, 17}
    end

    test "parses an ISO 8601:2004 string" do
      assert Busloc.date("2015-01-23") == {2015, 1, 23}
    end

    test "returns nil when passed nil" do
      assert Busloc.date(nil) == nil
    end
  end
end
