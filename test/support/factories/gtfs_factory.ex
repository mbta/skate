defmodule Skate.GtfsFactory do
  @moduledoc """
  Defines ExMachina factory functions for `Skate.Factory` related to GTFS objects
  """

  defmacro __using__(_opts) do
    quote do
      def gtfs_realtime_enhanced_trip_descriptor_factory do
        %{
          "direction_id" => 0,
          "overload_offset" => -6,
          "route_id" => "Green-E",
          "schedule_relationship" => "SCHEDULED",
          "start_date" => "20180815",
          "start_time" => nil,
          "tm_trip_id" => "37165437-X"
        }
      end

      def gtfs_realtime_enhanced_vehicle_position_factory do
        %{
          "block_id" => "Q238-135",
          "capacity" => 18,
          "congestion_level" => nil,
          "current_status" => "STOPPED_AT",
          "current_stop_sequence" => 670,
          "load" => 12,
          "location_source" => "samsara",
          "occupancy_percentage" => 0.67,
          "occupancy_status" => "FEW_SEATS_AVAILABLE",
          "operator" => %{
            "id" => build(:operator_id),
            "logon_time" => 1_754_913_545,
            "first_name" => build(:first_name),
            "last_name" => "EVANS"
          },
          "position" => %{
            "bearing" => 135,
            "latitude" => 42.32951,
            "longitude" => -71.11109,
            "odometer" => 5.1,
            "speed" => 2.9796
          },
          "run_id" => "128-1007",
          "stop_id" => "70257",
          "timestamp" => 1_754_913_600,
          "trip" => build(:gtfs_realtime_enhanced_trip_descriptor),
          "vehicle" => %{
            "id" => "G-10098",
            "label" => "3823-3605",
            "license_plate" => nil,
            "state_of_charge_percentage" => 86,
            "state_of_charge_timestamp" => 1_754_913_540
          },
          "revenue" => false
        }
      end

      def gtfs_stoptime_factory do
        %Schedule.Gtfs.StopTime{
          stop_id: "stop1",
          time: 150,
          timepoint_id: "t1"
        }
      end

      def gtfs_stop_factory do
        stop_id = sequence("Schedule.Gtfs.Stop.id:")

        %Schedule.Gtfs.Stop{
          id: stop_id,
          name: "Stop #{stop_id}",
          location_type: :stop,
          latitude: 42.01,
          longitude: -71.01
        }
      end

      def gtfs_route_factory do
        %Schedule.Gtfs.Route{
          id: "route",
          description: "Key Bus",
          direction_names: %{0 => "Outbound", 1 => "Inbound"},
          name: "Point A - Point B",
          garages: MapSet.new([])
        }
      end

      def gtfs_route_pattern_factory do
        route_pattern_id = sequence("Schedule.Gtfs.RoutePattern.id:")

        %Schedule.Gtfs.RoutePattern{
          id: route_pattern_id,
          name: "",
          route_id: "route",
          direction_id: 0,
          representative_trip_id: "#{route_pattern_id}_representative_trip_id",
          time_desc: nil,
          sort_order: 1
        }
      end

      def gtfs_shape_point_factory do
        %Schedule.Gtfs.Shape.Point{
          shape_id: "shape1",
          lat: 42.413560 + sequence(:shape_point_seq, &(&1 * 0.001)),
          lon: -70.992110 + sequence(:shape_point_seq, &(&1 * 0.001)),
          sequence: sequence(:shape_point_seq, & &1)
        }
      end

      def gtfs_shape_factory(attrs) do
        shape_id = Map.get(attrs, :id, "shape1")

        shape = %Schedule.Gtfs.Shape{
          id: shape_id,
          points: build_list(10, :gtfs_shape_point, %{shape_id: shape_id})
        }

        merge_attributes(shape, attrs)
      end

      def gtfs_timepoint_factory(attrs) do
        id = Map.get(attrs, :id, sequence("Schedule.Gtfs.Timepoint.id:"))

        %Schedule.Gtfs.Timepoint{
          id: id,
          name: "Timepoint #{id}"
        }
      end
    end
  end
end
