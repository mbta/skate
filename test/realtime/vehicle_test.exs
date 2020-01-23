defmodule Realtime.VehicleTest do
  use ExUnit.Case
  import Test.Support.Helpers

  alias Concentrate.Busloc
  alias Concentrate.DataDiscrepancy
  alias Concentrate.Swiftly
  alias Gtfs.{StopTime, Trip}
  alias Realtime.Vehicle

  @busloc %Busloc{
    id: "id",
    trip_id: "trip",
    label: "label",
    latitude: 12.01,
    longitude: 12.15,
    bearing: 123,
    speed: 19.0,
    last_updated: 1234,
    block_id: "block",
    run_id: "run",
    operator_id: "operatorbadge",
    operator_name: "operatorname"
  }

  @swiftly %Swiftly{
    id: "id",
    trip_id: "trip",
    stop_id: "18513",
    latitude: 13.01,
    longitude: 13.15,
    last_updated: 1235,
    speed: 19.1,
    bearing: 124,
    block_id: "block",
    run_id: "123-0123",
    operator_id: "operatorbadge",
    operator_name: "operatorname",
    stop_name: "stop name",
    direction_id: 1,
    headsign: "headsign",
    headway_secs: 901,
    is_nonrevenue: false,
    layover_departure_time: 1236,
    previous_vehicle_id: nil,
    previous_vehicle_schedule_adherence_secs: nil,
    previous_vehicle_schedule_adherence_string: nil,
    route_id: "28",
    schedule_adherence_secs: 500,
    schedule_adherence_string: "late",
    scheduled_headway_secs: 900
  }

  @vehicle %Vehicle{
    id: "id",
    label: "label",
    timestamp: 1235,
    latitude: 13.01,
    longitude: 13.15,
    direction_id: 1,
    route_id: "28",
    trip_id: "trip",
    headsign: "headsign",
    via_variant: "_",
    bearing: 124,
    block_id: "block",
    operator_id: "operatorbadge",
    operator_name: "operatorname",
    run_id: "123-0123",
    headway_secs: 901,
    headway_spacing: :ok,
    previous_vehicle_id: nil,
    schedule_adherence_secs: 500,
    scheduled_headway_secs: 900,
    is_off_course: false,
    layover_departure_time: 1236,
    block_is_active: true,
    sources: [:busloc, :swiftly],
    data_discrepancies: [],
    stop_status: %{
      stop_id: "18513",
      stop_name: "stop name"
    },
    timepoint_status: %{
      timepoint_id: "tp2",
      fraction_until_timepoint: 0.0
    },
    scheduled_location: %{
      route_id: "28",
      direction_id: 1,
      timepoint_status: %{
        timepoint_id: "tp1",
        fraction_until_timepoint: 0.0
      }
    },
    route_status: :on_route,
    end_of_trip_type: :pull_back
  }

  describe "from_sources" do
    setup do
      trip = %Trip{
        id: "trip",
        route_id: "28",
        service_id: "service",
        headsign: "headsign",
        direction_id: 1,
        block_id: "block",
        route_pattern_id: "route-_-0",
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

    test "translates Concentrate output into a vehicle struct" do
      sources = %{
        busloc: @busloc,
        swiftly: @swiftly
      }

      assert Vehicle.from_sources(sources) == @vehicle
    end

    test "can make a vehicle from only swiftly" do
      sources = %{
        busloc: nil,
        swiftly: @swiftly
      }

      assert Vehicle.from_sources(sources) == %{@vehicle | sources: [:swiftly], label: nil}
    end

    test "missing headway_secs results in missing headway_spacing" do
      sources = %{
        busloc: @busloc,
        swiftly: %{@swiftly | headway_secs: nil}
      }

      result = Vehicle.from_sources(sources)
      assert result.headway_secs == nil
      assert result.headway_spacing == nil
    end

    test "takes the more recent latlng" do
      sources = %{
        busloc: %{@busloc | last_updated: 101, latitude: 10.1, longitude: 11.1},
        swiftly: %{@swiftly | last_updated: 100, latitude: 10.0, longitude: 11.0}
      }

      result = Vehicle.from_sources(sources)
      assert result.latitude == 10.1
      assert result.longitude == 11.1
    end

    test "prioritizes the swiftly trip_id" do
      sources = %{
        busloc: %{@busloc | last_updated: 101, trip_id: "busloc-trip"},
        swiftly: %{@swiftly | last_updated: 100, trip_id: "swiftly-trip"}
      }

      result = Vehicle.from_sources(sources)
      assert result.trip_id == "swiftly-trip"
    end
  end

  describe "off_course?/2" do
    test "returns true if busloc has a trip_id and swiftly doesn't" do
      assert Vehicle.off_course?(%{
               busloc: %{@busloc | trip_id: "busloc-trip"},
               swiftly: %{@swiftly | trip_id: nil}
             })
    end

    test "returns false if busloc and swiftly both give trip_ids" do
      refute Vehicle.off_course?(%{
               busloc: %{@busloc | trip_id: "busloc-trip"},
               swiftly: %{@swiftly | trip_id: "swiftly-trip"}
             })
    end

    test "returns false if busloc and swiftly have the same trip_id" do
      refute Vehicle.off_course?(%{
               busloc: %{@busloc | trip_id: "same-trip"},
               swiftly: %{@swiftly | trip_id: "same-trip"}
             })
    end

    test "returns false if swiftly has no data" do
      refute Vehicle.off_course?(%{
               busloc: %{@busloc | trip_id: "busloc-trip"},
               swiftly: nil
             })
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

    test "returns :pulling_out if approaching the first stop of the block", %{
      trip1: trip1,
      block: block
    } do
      assert Vehicle.route_status("s1", trip1, block) == :pulling_out
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

    test "returns :pulling_out if we can't find the trip" do
      assert Vehicle.route_status("s1", nil, nil) == :pulling_out
    end

    test "if we find the trip but not the block, assume the trip is not the first in the block",
         %{trip1: trip1} do
      assert Vehicle.route_status("s1", trip1, nil) == :laying_over
      assert Vehicle.route_status("s2", trip1, nil) == :on_route
    end
  end

  describe "end_of_trip_type/2" do
    setup do
      first_trip = %Trip{
        id: "t1",
        route_id: "r1",
        service_id: "service",
        headsign: "Trip 1",
        direction_id: 1,
        block_id: "b",
        shape_id: "shape1",
        run_id: "run1",
        stop_times: [
          %StopTime{
            stop_id: "start",
            time: 0
          },
          %StopTime{
            stop_id: "middle",
            time: 0
          },
          %StopTime{
            stop_id: "end",
            time: 0
          }
        ]
      }

      last_trip_of_run = %Trip{
        id: "t2",
        route_id: "r1",
        service_id: "service",
        headsign: "Trip 2",
        direction_id: 0,
        block_id: "b",
        shape_id: "shape2",
        run_id: "run1",
        stop_times: [
          %StopTime{
            stop_id: "start",
            time: 0
          },
          %StopTime{
            stop_id: "middle",
            time: 0
          },
          %StopTime{
            stop_id: "end",
            time: 0
          }
        ]
      }

      last_trip_of_block = %Trip{
        id: "t3",
        route_id: "r1",
        service_id: "service",
        headsign: "Trip 33",
        direction_id: 0,
        block_id: "b",
        shape_id: "shape3",
        run_id: "run2",
        stop_times: [
          %StopTime{
            stop_id: "start",
            time: 0
          },
          %StopTime{
            stop_id: "middle",
            time: 0
          },
          %StopTime{
            stop_id: "end",
            time: 0
          }
        ]
      }

      block = [first_trip, last_trip_of_run, last_trip_of_block]

      {:ok,
       first_trip: first_trip,
       last_trip_of_run: last_trip_of_run,
       last_trip_of_block: last_trip_of_block,
       block: block}
    end

    test "when pulling out, returns :another_trip", %{
      first_trip: first_trip,
      block: block
    } do
      assert Vehicle.end_of_trip_type(block, first_trip, "run1", "start") == :another_trip
    end

    test "when in the middle of a trip in the middle of a run, returns :another_trip", %{
      first_trip: first_trip,
      block: block
    } do
      assert Vehicle.end_of_trip_type(block, first_trip, "run1", "middle") == :another_trip
    end

    test "when laying over before the last trip of a run, returns :another_trip", %{
      last_trip_of_run: last_trip_of_run,
      block: block
    } do
      assert Vehicle.end_of_trip_type(block, last_trip_of_run, "run1", "start") == :another_trip
    end

    test "when in the middle of the last trip of a run, returns :swing_off", %{
      last_trip_of_run: last_trip_of_run,
      block: block
    } do
      assert Vehicle.end_of_trip_type(block, last_trip_of_run, "run1", "middle") == :swing_off
    end

    test "when laying over and swinging off, before logging off, returns :swing_off", %{
      last_trip_of_block: last_trip_of_block,
      block: block
    } do
      assert Vehicle.end_of_trip_type(block, last_trip_of_block, "run1", "start") == :swing_off
    end

    test "when laying over and swinging off, after logging in, returns :another_trip", %{
      last_trip_of_block: last_trip_of_block,
      block: block
    } do
      assert Vehicle.end_of_trip_type(block, last_trip_of_block, "run2", "start") == :another_trip
    end

    test "when in the middle of the last trip of the block, returns :pull_back", %{
      last_trip_of_block: last_trip_of_block,
      block: block
    } do
      assert Vehicle.end_of_trip_type(block, last_trip_of_block, "run2", "middle") == :pull_back
    end

    test "defaults to :another_trip if we're missing data", %{
      last_trip_of_block: last_trip_of_block,
      block: block
    } do
      assert Vehicle.end_of_trip_type(nil, last_trip_of_block, "run2", "middle") == :another_trip
      assert Vehicle.end_of_trip_type(block, nil, "run2", "middle") == :another_trip
      assert Vehicle.end_of_trip_type(block, last_trip_of_block, nil, "middle") == :another_trip
      assert Vehicle.end_of_trip_type(block, last_trip_of_block, "run2", nil) == :another_trip
    end

    test "doesn't consider it a swing off if the next trip's run is nil", %{
      last_trip_of_block: last_trip_of_block,
      block: block
    } do
      assert Vehicle.end_of_trip_type(block, %{last_trip_of_block | run_id: nil}, "run1", "start") ==
               :another_trip
    end

    test "defaults to :another_trip if the trip isn't in the block", %{
      last_trip_of_block: last_trip_of_block
    } do
      assert Vehicle.end_of_trip_type([], last_trip_of_block, "run2", "middle") == :another_trip
    end
  end

  describe "data_discrepancies" do
    test "makes a data discrepancy if the trip_ids are different" do
      assert Vehicle.data_discrepancies(%{
               busloc: %{@busloc | trip_id: "busloc-trip"},
               swiftly: %{@swiftly | trip_id: "swiftly-trip"}
             }) == [
               %DataDiscrepancy{
                 attribute: "trip_id",
                 sources: [
                   %{
                     id: :busloc,
                     value: "busloc-trip"
                   },
                   %{
                     id: :swiftly,
                     value: "swiftly-trip"
                   }
                 ]
               }
             ]
    end

    test "doesn't make a data discrepancy if the trip_ids are the same" do
      assert Vehicle.data_discrepancies(%{
               busloc: %{@busloc | trip_id: "trip"},
               swiftly: %{@swiftly | trip_id: "trip"}
             }) == []
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
        route_status: :on_route,
        end_of_trip_type: :another_trip
      }

      encoded_string = Jason.encode!(vehicle)

      assert encoded_string =~ "\"id\":\"y1261\""

      assert encoded_string =~ "\"route_id\":\"28\""

      assert encoded_string =~
               "\"data_discrepancies\":[{\"attribute\":\"trip_id\",\"sources\":[{\"id\":\"swiftly\",\"value\":\"swiftly-trip-id\"},{\"id\":\"busloc\",\"value\":\"busloc-trip-id\"}]},{\"attribute\":\"route_id\",\"sources\":[{\"id\":\"swiftly\",\"value\":null},{\"id\":\"busloc\",\"value\":\"busloc-route-id\"}]}]"
    end
  end
end
