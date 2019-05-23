defmodule Realtime.VehicleTest do
  use ExUnit.Case, async: true

  alias Concentrate.{TripUpdate, VehiclePosition}
  alias Gtfs.{StopTime, Trip}
  alias Realtime.Vehicle

  describe "from_vehicle_position_and_trip_update/2" do
    setup do
      real_trip_fn = Application.get_env(:realtime, :trip_fn)

      on_exit(fn ->
        Application.put_env(:realtime, :trip_fn, real_trip_fn)
      end)

      Application.put_env(:realtime, :trip_fn, fn "39984755" ->
        %Trip{
          id: "39984755",
          route_id: "505",
          headsign: "headsign",
          route_pattern_id: "505-_-0",
          stop_times: [
            %StopTime{stop_id: "6553", timepoint_id: "tp1"},
            %StopTime{stop_id: "6554", timepoint_id: nil},
            %StopTime{stop_id: "6555", timepoint_id: "tp2"}
          ]
        }
      end)
    end

    test "translates Concentrate VehiclePosition and TripUpdate data into a Vehicle struct" do
      vehicle_position = %VehiclePosition{
        bearing: 0,
        block_id: "S28-2",
        id: "y1261",
        label: "1261",
        last_updated: 1_558_364_020,
        latitude: 42.31777347,
        license_plate: nil,
        longitude: -71.08206019,
        odometer: nil,
        operator_id: "72032",
        operator_name: "MAUPIN",
        run_id: "138-1038",
        speed: 0.0,
        status: :IN_TRANSIT_TO,
        stop_id: "392",
        stop_sequence: 25,
        trip_id: "39875910"
      }

      trip_update = %TripUpdate{
        direction_id: 1,
        route_id: "28",
        schedule_relationship: :SCHEDULED,
        start_date: {2019, 5, 20},
        start_time: nil,
        trip_id: "39875910"
      }

      expected_result = %Vehicle{
        id: "y1261",
        label: "1261",
        timestamp: 1_558_364_020,
        latitude: 42.31777347,
        longitude: -71.08206019,
        direction_id: 1,
        route_id: "28",
        trip_id: "39875910",
        headsign: "headsign",
        via_variant: "_",
        bearing: 0,
        speed: 0.0,
        stop_sequence: 25,
        block_id: "S28-2",
        operator_id: "72032",
        operator_name: "MAUPIN",
        run_id: "138-1038",
        stop_status: %{
          status: :in_transit_to,
          stop_id: "392"
        },
        timepoint_status: nil
      }

      result = Vehicle.from_vehicle_position_and_trip_update(vehicle_position, trip_update)

      assert result == expected_result
    end

    test "returns nil if not given a VehiclePosition" do
      vehicle_position = nil

      trip_update = %TripUpdate{
        direction_id: 1,
        route_id: "28",
        schedule_relationship: :SCHEDULED,
        start_date: {2019, 5, 20},
        start_time: nil,
        trip_id: "39875910"
      }

      result = Vehicle.from_vehicle_position_and_trip_update(vehicle_position, trip_update)

      assert result == nil
    end

    test "returns nil if not given a TripUpdate" do
      vehicle_position = %VehiclePosition{
        bearing: 0,
        block_id: "S28-2",
        id: "y1261",
        label: "1261",
        last_updated: 1_558_364_020,
        latitude: 42.31777347,
        license_plate: nil,
        longitude: -71.08206019,
        odometer: nil,
        operator_id: "72032",
        operator_name: "MAUPIN",
        run_id: "138-1038",
        speed: 0.0,
        status: :IN_TRANSIT_TO,
        stop_id: "392",
        stop_sequence: 25,
        trip_id: "39875910"
      }

      trip_update = nil

      result = Vehicle.from_vehicle_position_and_trip_update(vehicle_position, trip_update)

      assert result == nil
    end
  end

  describe "timepoint_status/3" do
    test "returns 0.0 if the stop is a timepoint, plus the timepoint" do
      stop_times = [
        %StopTime{
          stop_id: "s1",
          timepoint_id: "tp1"
        },
        %StopTime{
          stop_id: "s2",
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s3",
          timepoint_id: "tp3"
        },
        %StopTime{
          stop_id: "s4",
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s5",
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s6",
          timepoint_id: "tp2"
        }
      ]

      stop_id = "s3"

      assert Vehicle.timepoint_status(stop_times, stop_id) == %{
               timepoint_id: "tp3",
               fraction_until_timepoint: 0.0
             }
    end

    test "returns the ratio of stops to next timepoint vs stops to last timepoint if the stop is not a timepoint, plus the next timepoint" do
      stop_times = [
        %StopTime{
          stop_id: "s1",
          timepoint_id: "tp1"
        },
        %StopTime{
          stop_id: "s2",
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s3",
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s4",
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s5",
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s6",
          timepoint_id: "tp2"
        }
      ]

      stop_id = "s3"

      assert Vehicle.timepoint_status(stop_times, stop_id) == %{
               timepoint_id: "tp2",
               fraction_until_timepoint: 0.6
             }
    end

    test "returns 0.0 if the stop is the first timepoint" do
      stop_times = [
        %StopTime{
          stop_id: "s1",
          timepoint_id: "tp1"
        },
        %StopTime{
          stop_id: "s2",
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s3",
          timepoint_id: "tp3"
        }
      ]

      stop_id = "s1"

      assert Vehicle.timepoint_status(stop_times, stop_id) == %{
               timepoint_id: "tp1",
               fraction_until_timepoint: 0.0
             }
    end

    test "returns nil if on a route without timepoints" do
      stop_times = [
        %StopTime{
          stop_id: "s1",
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s2",
          timepoint_id: nil
        }
      ]

      stop_id = "s2"

      assert Vehicle.timepoint_status(stop_times, stop_id) == nil
    end
  end
end
