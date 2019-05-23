defmodule Concentrate.Parser.GTFSRealtimeTest do
  use ExUnit.Case, async: true

  import Concentrate.TestHelpers

  alias Concentrate.{StopTimeUpdate, TripUpdate, VehiclePosition}
  alias Concentrate.Parser.GTFSRealtime

  describe "parse/1" do
    test "parsing an enhanced VehiclePositions JSON file returns only VehiclePosition or TripUpdate structs" do
      binary = File.read!(fixture_path("VehiclePositions.json"))
      parsed = GTFSRealtime.parse(binary)
      assert is_list(parsed)

      for update <- parsed do
        assert update.__struct__ in [StopTimeUpdate, TripUpdate, VehiclePosition]
      end
    end
  end

  describe "decode_trip_update/1" do
    test "can handle boarding status information" do
      update = %{
        "trip" => %{},
        "stop_time_update" => [
          %{
            "boarding_status" => "ALL_ABOARD"
          }
        ]
      }

      [_tu, stop_update] = GTFSRealtime.decode_trip_update(update)
      assert StopTimeUpdate.status(stop_update) == "ALL_ABOARD"
    end

    test "can handle platform id information" do
      update = %{
        "trip" => %{},
        "stop_time_update" => [
          %{
            "platform_id" => "platform"
          }
        ]
      }

      [_tu, stop_update] = GTFSRealtime.decode_trip_update(update)
      assert StopTimeUpdate.platform_id(stop_update) == "platform"
    end

    test "treats a missing schedule relationship as SCHEDULED" do
      update = %{
        "trip" => %{},
        "stop_time_update" => [
          %{}
        ]
      }

      [tu, stu] = GTFSRealtime.decode_trip_update(update)
      assert TripUpdate.schedule_relationship(tu) == :SCHEDULED
      assert StopTimeUpdate.schedule_relationship(stu) == :SCHEDULED
    end
  end

  describe "decode_vehicle/1" do
    test "returns nothing if there's an empty map" do
      assert GTFSRealtime.decode_vehicle(%{}) == []
    end

    test "decodes a VehiclePosition JSON map" do
      input = %{
        "current_status" => "IN_TRANSIT_TO",
        "current_stop_sequence" => 1,
        "position" => %{
          "bearing" => 90,
          "latitude" => 42.3408753,
          "longitude" => -71.0639172
        },
        "stop_id" => "6551",
        "timestamp" => 1_558_034_935,
        "trip" => %{
          "direction_id" => 0,
          "route_id" => "505",
          "schedule_relationship" => "SCHEDULED",
          "start_date" => "20190516",
          "trip_id" => "39984755"
        },
        "vehicle" => %{"id" => "y0568", "label" => "0568"}
      }

      assert [tu, vp] = GTFSRealtime.decode_vehicle(input)

      assert tu ==
               TripUpdate.new(
                 trip_id: "39984755",
                 route_id: "505",
                 direction_id: 0,
                 start_date: {2019, 5, 16},
                 schedule_relationship: :SCHEDULED
               )

      assert vp ==
               VehiclePosition.new(
                 id: "y0568",
                 label: "0568",
                 latitude: 42.3408753,
                 longitude: -71.0639172,
                 bearing: 90,
                 stop_id: "6551",
                 trip_id: "39984755",
                 stop_sequence: 1,
                 status: :IN_TRANSIT_TO,
                 last_updated: 1_558_034_935
               )
    end
  end

  describe "date/1" do
    test "parses an epoch string" do
      assert GTFSRealtime.date("20190517") == {2019, 5, 17}
    end

    test "parses an ISO 8601:2004 string" do
      assert GTFSRealtime.date("2015-01-23") == {2015, 1, 23}
    end

    test "returns nil when passed nil" do
      assert GTFSRealtime.date(nil) == nil
    end
  end
end
