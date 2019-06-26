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

      Application.put_env(:realtime, :trip_fn, fn trip_id ->
        if trip_id == "39984755" do
          %Trip{
            id: "39984755",
            route_id: "505",
            headsign: "headsign",
            route_pattern_id: "505-_-0",
            stop_times: [
              %StopTime{stop_id: "6553", time: 0, timepoint_id: "tp1"},
              %StopTime{stop_id: "6554", time: 0, timepoint_id: nil},
              %StopTime{stop_id: "6555", time: 0, timepoint_id: "tp2"}
            ]
          }
        else
          nil
        end
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
        trip_id: "39984755",
        direction_id: 1,
        route_id: "28"
      }

      trip_update = %TripUpdate{
        direction_id: 1,
        route_id: "28",
        schedule_relationship: :SCHEDULED,
        start_date: {2019, 5, 20},
        start_time: nil,
        trip_id: "39984755"
      }

      expected_result = %Vehicle{
        id: "y1261",
        label: "1261",
        timestamp: 1_558_364_020,
        latitude: 42.31777347,
        longitude: -71.08206019,
        direction_id: 1,
        route_id: "28",
        trip_id: "39984755",
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
          stop_id: "392",
          stop_name: "392"
        },
        timepoint_status: nil,
        route_status: :on_route
      }

      result = Vehicle.from_vehicle_position_and_trip_update(vehicle_position, trip_update)

      assert result == expected_result
    end

    test "takes direction_id and route_id values from TripUpdate if they aren't present on VehiclePosition" do
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
        trip_id: "39984755"
      }

      trip_update = %TripUpdate{
        direction_id: 1,
        route_id: "28",
        schedule_relationship: :SCHEDULED,
        start_date: {2019, 5, 20},
        start_time: nil,
        trip_id: "39984755"
      }

      expected_result = %Vehicle{
        id: "y1261",
        label: "1261",
        timestamp: 1_558_364_020,
        latitude: 42.31777347,
        longitude: -71.08206019,
        direction_id: 1,
        route_id: "28",
        trip_id: "39984755",
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
          stop_id: "392",
          stop_name: "392"
        },
        timepoint_status: nil,
        route_status: :on_route
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
        trip_id: "39984755"
      }

      result = Vehicle.from_vehicle_position_and_trip_update(vehicle_position, trip_update)

      assert result == nil
    end

    test "returns a Vehicle struct even if not given a TripUpdate" do
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
        trip_id: "39984755"
      }

      trip_update = nil

      result = Vehicle.from_vehicle_position_and_trip_update(vehicle_position, trip_update)

      assert %Vehicle{} = result
    end
  end

  describe "timepoint_status/2" do
    test "returns 0.0 if the stop is a timepoint, plus the timepoint" do
      stop_times = [
        %StopTime{
          stop_id: "s1",
          time: 0,
          timepoint_id: "tp1"
        },
        %StopTime{
          stop_id: "s2",
          time: 0,
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s3",
          time: 0,
          timepoint_id: "tp3"
        },
        %StopTime{
          stop_id: "s4",
          time: 0,
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s5",
          time: 0,
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s6",
          time: 0,
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
          time: 0,
          timepoint_id: "tp1"
        },
        %StopTime{
          stop_id: "s2",
          time: 0,
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s3",
          time: 0,
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s4",
          time: 0,
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s5",
          time: 0,
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s6",
          time: 0,
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
          time: 0,
          timepoint_id: "tp1"
        },
        %StopTime{
          stop_id: "s2",
          time: 0,
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s3",
          time: 0,
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
          time: 0,
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s2",
          time: 0,
          timepoint_id: nil
        }
      ]

      stop_id = "s2"

      assert Vehicle.timepoint_status(stop_times, stop_id) == nil
    end
  end

  describe "scheduled_timepoint_status/2" do
    test "returns the next timepoint it's scheduled to be at" do
      stop_times = [
        %StopTime{
          stop_id: "1",
          time: Util.Time.parse_hhmmss("12:05:00"),
          timepoint_id: "1"
        },
        %StopTime{
          stop_id: "2",
          time: Util.Time.parse_hhmmss("12:10:00"),
          timepoint_id: "2"
        },
        %StopTime{
          stop_id: "3",
          time: Util.Time.parse_hhmmss("12:20:00"),
          timepoint_id: "3"
        }
      ]

      # 2019-01-01 12:17:30 EST
      now = 1_546_363_050

      assert Vehicle.scheduled_timepoint_status(stop_times, now) == %{
               timepoint_id: "3",
               fraction_until_timepoint: 0.25
             }
    end

    test "returns nil if the trip is in the future" do
      stop_times = [
        %StopTime{
          stop_id: "1",
          time: Util.Time.parse_hhmmss("13:05:00"),
          timepoint_id: "1"
        },
        %StopTime{
          stop_id: "2",
          time: Util.Time.parse_hhmmss("13:10:00"),
          timepoint_id: "2"
        }
      ]

      # 2019-01-01 12:17:30 EST
      now = 1_546_363_050
      assert Vehicle.scheduled_timepoint_status(stop_times, now) == nil
    end

    test "returns nil if the trip is in the past" do
      stop_times = [
        %StopTime{
          stop_id: "1",
          time: Util.Time.parse_hhmmss("11:05:00"),
          timepoint_id: "1"
        },
        %StopTime{
          stop_id: "2",
          time: Util.Time.parse_hhmmss("11:10:00"),
          timepoint_id: "2"
        }
      ]

      # 2019-01-01 12:17:30 EST
      now = 1_546_363_050
      assert Vehicle.scheduled_timepoint_status(stop_times, now) == nil
    end

    test "returns nil if we can't find the trip's stop_times" do
      # 2019-01-01 12:17:30 EST
      now = 1_546_363_050
      assert Vehicle.scheduled_timepoint_status([], now) == nil
    end
  end

  describe "route_status/3" do
    setup do
      trip = %Trip{
        id: "t1",
        route_id: "r1",
        headsign: "Trip 1",
        stop_times: [
          %StopTime{
            stop_id: "s1",
            time: 0,
            timepoint_id: "s1"
          },
          %StopTime{
            stop_id: "s2",
            time: 0,
            timepoint_id: nil
          }
        ]
      }

      {:ok, trip: trip}
    end

    test "returns :incoming if the trip is nil" do
      assert Vehicle.route_status(:in_transit_to, "s1", nil) == :incoming
    end

    test "returns :on_route if :stopped_at any stop", %{trip: trip} do
      assert Vehicle.route_status(:stopped_at, "s1", trip) == :on_route
    end

    test "returns :incoming if :in_transit_to the first stop of the trip", %{trip: trip} do
      assert Vehicle.route_status(:in_transit_to, "s1", trip) == :incoming
    end

    test "returns :on_route if :in_transit_to any other stop", %{trip: trip} do
      assert Vehicle.route_status(:in_transit_to, "s2", trip) == :on_route
    end
  end
end
