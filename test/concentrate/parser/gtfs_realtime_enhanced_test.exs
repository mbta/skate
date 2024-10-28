defmodule Concentrate.Parser.GTFSRealtimeEnhancedTest do
  use ExUnit.Case, async: true

  import Skate.Factory
  import Concentrate.TestHelpers

  alias Concentrate.{TripUpdate, StopTimeUpdate, VehiclePosition}
  alias Concentrate.Parser.GTFSRealtimeEnhanced
  alias Realtime.Crowding

  describe "parse/1" do
    test "parsing an enhanced VehiclePositions JSON file returns only VehiclePosition or TripUpdate structs" do
      binary = File.read!(fixture_path("VehiclePositions_enhanced.json"))
      parsed = GTFSRealtimeEnhanced.parse(binary)
      assert is_list(parsed)

      for update <- parsed do
        assert update.__struct__ in [StopTimeUpdate, TripUpdate, VehiclePosition]
      end
    end

    test "parsing an enhanced TripUpdates JSON file returns TripUpdate and StopTimeUpdate structs" do
      binary = File.read!(fixture_path("TripUpdates_enhanced.json"))
      parsed = GTFSRealtimeEnhanced.parse(binary)
      assert is_list(parsed)
      assert Enum.all?(parsed, &(&1.__struct__ in [TripUpdate, StopTimeUpdate]))
    end

    test "parsing a TripUpdates file preserves the remark field on StopTimeUpdate structs" do
      binary = File.read!(fixture_path("TripUpdates_enhanced.json"))
      parsed = GTFSRealtimeEnhanced.parse(binary)

      stop_time_updates =
        Enum.filter(parsed, fn
          %StopTimeUpdate{} -> true
          %TripUpdate{} -> false
        end)

      assert length(stop_time_updates) > 0
      assert Enum.all?(stop_time_updates, &match?(%{remark: _remark}, &1))
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

      [_tu, stop_update] = GTFSRealtimeEnhanced.decode_trip_update(update)
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

      [_tu, stop_update] = GTFSRealtimeEnhanced.decode_trip_update(update)
      assert StopTimeUpdate.platform_id(stop_update) == "platform"
    end

    test "treats a missing schedule relationship as SCHEDULED" do
      update = %{
        "trip" => %{},
        "stop_time_update" => [
          %{}
        ]
      }

      [tu, stu] = GTFSRealtimeEnhanced.decode_trip_update(update)
      assert TripUpdate.schedule_relationship(tu) == :SCHEDULED
      assert StopTimeUpdate.schedule_relationship(stu) == :SCHEDULED
    end
  end

  describe "decode_vehicle/1" do
    test "returns nothing if there's an empty map" do
      assert GTFSRealtimeEnhanced.decode_vehicle(%{}) == []
    end

    test "decodes a VehiclePosition JSON map" do
      input = build(:gtfs_realtime_enhanced_vehicle_position)

      assert [tu, vp] = GTFSRealtimeEnhanced.decode_vehicle(input)

      assert tu ==
               TripUpdate.new(
                 trip_id: "37165437-X",
                 route_id: "Green-E",
                 direction_id: 0,
                 overload_offset: -6,
                 start_date: {2018, 8, 15},
                 schedule_relationship: :SCHEDULED
               )

      assert vp ==
               VehiclePosition.new(
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
                 operator_id: input["operator"]["id"],
                 operator_first_name: input["operator"]["first_name"],
                 operator_last_name: input["operator"]["last_name"],
                 operator_logon_time: 1_534_340_301,
                 overload_offset: -6,
                 run_id: "128-1007",
                 current_status: :STOPPED_AT,
                 last_updated: 1_534_340_406,
                 last_updated_by_source: %{"busloc" => 1_534_340_406},
                 sources: MapSet.new(["busloc"]),
                 data_discrepancies: [],
                 crowding: %Crowding{
                   load: 12,
                   capacity: 18,
                   occupancy_percentage: 0.67,
                   occupancy_status: "FEW_SEATS_AVAILABLE"
                 },
                 revenue: false
               )
    end

    test "decodes a VehiclePosition JSON map, falling back on trip_id if tm_trip_id is absent" do
      input =
        build(:gtfs_realtime_enhanced_vehicle_position, %{
          trip:
            :gtfs_realtime_enhanced_trip_descriptor
            |> build(%{"trip_id" => "37165437-X"})
            |> Map.drop(["tm_trip_id"])
        })

      assert [tu, vp] = GTFSRealtimeEnhanced.decode_vehicle(input)

      assert %TripUpdate{trip_id: "37165437-X"} = tu

      assert %VehiclePosition{trip_id: "37165437-X"} = vp
    end
  end

  describe "date/1" do
    test "parses an epoch string" do
      assert GTFSRealtimeEnhanced.date("20190517") == {2019, 5, 17}
    end

    test "parses an ISO 8601:2004 string" do
      assert GTFSRealtimeEnhanced.date("2015-01-23") == {2015, 1, 23}
    end

    test "returns nil when passed nil" do
      assert GTFSRealtimeEnhanced.date(nil) == nil
    end
  end
end
