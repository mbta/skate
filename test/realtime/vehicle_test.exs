defmodule Realtime.VehicleTest do
  use ExUnit.Case
  import Test.Support.Helpers

  alias Concentrate.{DataDiscrepancy, VehiclePosition}
  alias Gtfs.{StopTime, Trip}
  alias Realtime.Vehicle

  @vehicle_position %VehiclePosition{
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
    headway_secs: 900,
    is_nonrevenue: false,
    layover_departure_time: nil,
    speed: 0.0,
    current_status: :IN_TRANSIT_TO,
    stop_id: "392",
    stop_sequence: 25,
    trip_id: "39984755",
    direction_id: 1,
    route_id: "28",
    sources: MapSet.new(["swiftly", "busloc"]),
    data_discrepancies: [
      %DataDiscrepancy{
        attribute: :trip_id,
        sources: [
          %{id: "swiftly", value: "swiftly-trip-id"},
          %{id: "busloc", value: "busloc-trip-id"}
        ]
      },
      %DataDiscrepancy{
        attribute: :route_id,
        sources: [
          %{id: "swiftly", value: "swiftly-route-id"},
          %{id: "busloc", value: "busloc-route-id"}
        ]
      }
    ]
  }

  describe "from_vehicle_position" do
    setup do
      trip = %Trip{
        id: "39984755",
        route_id: "28",
        service_id: "service",
        headsign: "headsign",
        direction_id: 1,
        block_id: "S28-2",
        route_pattern_id: "28-_-0",
        shape_id: "shape1",
        stop_times: [
          %StopTime{stop_id: "18511", time: 0, timepoint_id: "tp1"},
          %StopTime{stop_id: "18512", time: 1, timepoint_id: nil},
          %StopTime{stop_id: "18513", time: 2, timepoint_id: "tp2"}
        ]
      }

      reassign_env(:realtime, :trip_fn, fn trip_id ->
        if trip_id == trip.id do
          trip
        else
          nil
        end
      end)

      reassign_env(:realtime, :block_fn, fn block_id, service_id ->
        if block_id == trip.block_id and service_id == trip.service_id do
          [trip]
        else
          nil
        end
      end)

      reassign_env(:realtime, :now_fn, fn ->
        # 2019-01-01 00:00:00 EST
        1_546_318_800
      end)

      reassign_env(:realtime, :date_time_now_fn, fn ->
        # Monday at noon
        Timex.to_datetime({{2019, 7, 8}, {12, 00, 00}}, :local)
      end)
    end

    test "translates Concentrate VehiclePosition into a Vehicle struct" do
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
        block_id: "S28-2",
        operator_id: "72032",
        operator_name: "MAUPIN",
        run_id: "138-1038",
        headway_secs: 900,
        headway_spacing: :ok,
        is_off_course: false,
        layover_departure_time: nil,
        block_is_active: true,
        sources: MapSet.new(["swiftly", "busloc"]),
        data_discrepancies: [
          %DataDiscrepancy{
            attribute: :trip_id,
            sources: [
              %{id: "swiftly", value: "swiftly-trip-id"},
              %{id: "busloc", value: "busloc-trip-id"}
            ]
          },
          %DataDiscrepancy{
            attribute: :route_id,
            sources: [
              %{id: "swiftly", value: "swiftly-route-id"},
              %{id: "busloc", value: "busloc-route-id"}
            ]
          }
        ],
        stop_status: %{
          stop_id: "392",
          stop_name: "392"
        },
        timepoint_status: nil,
        scheduled_location: %{
          route_id: "28",
          direction_id: 1,
          timepoint_status: %{
            timepoint_id: "tp1",
            fraction_until_timepoint: 0.0
          }
        },
        route_status: :on_route
      }

      result = Vehicle.from_vehicle_position(@vehicle_position)

      assert result == expected_result
    end

    test "missing headway_secs results in missing headway_spacing" do
      vehicle_position = %{@vehicle_position | headway_secs: nil}
      result = Vehicle.from_vehicle_position(vehicle_position)
      assert result.headway_secs == nil
      assert result.headway_spacing == nil
    end
  end

  describe "off_course?/2" do
    test "returns true if there is a trip_id data discrepancy where swiftly is null and busloc has a value" do
      data_discrepancies = [
        %DataDiscrepancy{
          attribute: :trip_id,
          sources: [
            %{id: "swiftly", value: nil},
            %{id: "busloc", value: "busloc-trip-id"}
          ]
        }
      ]

      assert Vehicle.off_course?(data_discrepancies)
    end

    test "returns false if the swiftly defined a value" do
      data_discrepancies = [
        %DataDiscrepancy{
          attribute: "trip_id",
          sources: [
            %{
              id: "swiftly",
              value: "swiftly-trip-id"
            },
            %{
              id: "busloc",
              value: "busloc-trip-id"
            }
          ]
        }
      ]

      refute Vehicle.off_course?(data_discrepancies)
    end

    test "returns false if there isn't a trip_id data discrepancy" do
      data_discrepancies = [
        %DataDiscrepancy{
          attribute: "route_id",
          sources: [
            %{
              id: "swiftly",
              value: "swiftly-route-id"
            },
            %{
              id: "busloc",
              value: "busloc-route-id"
            }
          ]
        }
      ]

      refute Vehicle.off_course?(data_discrepancies)
    end
  end

  describe "active_block?" do
    setup do
      block = [
        %Trip{
          id: "1",
          route_id: "28",
          service_id: "service",
          headsign: "headsign",
          direction_id: 1,
          block_id: "S28-2",
          route_pattern_id: "28-_-1",
          shape_id: "shape1",
          stop_times: [
            %StopTime{
              stop_id: "6553",
              time: Util.Time.parse_hhmmss("11:01:00"),
              timepoint_id: "tp1"
            },
            %StopTime{
              stop_id: "6555",
              time: Util.Time.parse_hhmmss("11:59:00"),
              timepoint_id: "tp2"
            }
          ]
        }
      ]

      {:ok, block: block}
    end

    test "returns true if the vehicle is not off course", %{block: block} do
      is_off_course = false
      # 2019-01-01 12:00:00 EST
      now = 1_546_362_000

      assert Vehicle.active_block?(is_off_course, block, now)
    end

    test "returns false if the block ended more than an hour ago", %{block: block} do
      is_off_course = true
      # 2019-01-01 13:00:00 EST
      now = 1_546_365_600

      refute Vehicle.active_block?(is_off_course, block, now)
    end

    test "returns true if the block ended less than an hour ago", %{block: block} do
      is_off_course = true
      # 2019-01-01 12:30:00 EST
      now = 1_546_363_800

      assert Vehicle.active_block?(is_off_course, block, now)
    end

    test "returns true if the block ends in the future", %{block: block} do
      is_off_course = true
      # 2019-01-01 11:30:00 EST
      now = 1_546_358_400

      assert Vehicle.active_block?(is_off_course, block, now)
    end

    test "returns false if the block is nil" do
      is_off_course = true
      # 2019-01-01 12:30:00 EST
      now = 1_546_363_800

      refute Vehicle.active_block?(is_off_course, nil, now)
    end
  end

  describe "route_status/3" do
    setup do
      trip1 = %Trip{
        id: "t1",
        route_id: "r1",
        service_id: "service",
        headsign: "Trip 1",
        direction_id: 1,
        block_id: "b",
        shape_id: "shape1",
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

      trip2 = %Trip{
        id: "t2",
        route_id: "r1",
        service_id: "service",
        headsign: "Trip 2",
        direction_id: 0,
        block_id: "b",
        shape_id: "shape2",
        stop_times: [
          %StopTime{
            stop_id: "s2",
            time: 0,
            timepoint_id: "s2"
          },
          %StopTime{
            stop_id: "s1",
            time: 0,
            timepoint_id: "s1"
          }
        ]
      }

      block = [trip1, trip2]

      {:ok, trip1: trip1, trip2: trip2, block: block}
    end

    test "returns :incoming if approaching the first stop of the block", %{
      trip1: trip1,
      block: block
    } do
      assert Vehicle.route_status("s1", trip1, block) == :incoming
    end

    test "returns :laying_over if starting a trip that's not the first of its block", %{
      trip2: trip2,
      block: block
    } do
      assert Vehicle.route_status("s2", trip2, block) == :laying_over
    end

    test "returns :on_route if in the middle of a trip", %{trip1: trip1, block: block} do
      assert Vehicle.route_status("s2", trip1, block) == :on_route
    end

    test "returns :incoming if we can't find the trip" do
      assert Vehicle.route_status("s1", nil, nil) == :incoming
    end

    test "if we find the trip but not the block, assume the trip is not the first in the block",
         %{trip1: trip1} do
      assert Vehicle.route_status("s1", trip1, nil) == :laying_over
      assert Vehicle.route_status("s2", trip1, nil) == :on_route
    end
  end

  describe "JSON encoding" do
    test "is encodable as JSON" do
      vehicle = %Vehicle{
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
        block_id: "S28-2",
        operator_id: "72032",
        operator_name: "MAUPIN",
        run_id: "138-1038",
        headway_secs: 600,
        headway_spacing: :ok,
        is_off_course: false,
        layover_departure_time: nil,
        block_is_active: true,
        sources: MapSet.new(["swiftly", "busloc"]),
        data_discrepancies: [
          %DataDiscrepancy{
            attribute: :trip_id,
            sources: [
              %{id: "swiftly", value: "swiftly-trip-id"},
              %{id: "busloc", value: "busloc-trip-id"}
            ]
          },
          %DataDiscrepancy{
            attribute: :route_id,
            sources: [
              %{id: "swiftly", value: nil},
              %{id: "busloc", value: "busloc-route-id"}
            ]
          }
        ],
        stop_status: %{
          stop_id: "392",
          stop_name: "392"
        },
        timepoint_status: nil,
        scheduled_location: nil,
        route_status: :on_route
      }

      encoded_string = Jason.encode!(vehicle)

      assert encoded_string =~ "\"id\":\"y1261\""

      assert encoded_string =~ "\"route_id\":\"28\""

      assert encoded_string =~
               "\"data_discrepancies\":[{\"attribute\":\"trip_id\",\"sources\":[{\"id\":\"swiftly\",\"value\":\"swiftly-trip-id\"},{\"id\":\"busloc\",\"value\":\"busloc-trip-id\"}]},{\"attribute\":\"route_id\",\"sources\":[{\"id\":\"swiftly\",\"value\":null},{\"id\":\"busloc\",\"value\":\"busloc-route-id\"}]}]"
    end
  end
end
