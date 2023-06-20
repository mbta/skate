defmodule Realtime.VehicleTest do
  use ExUnit.Case

  import Skate.Factory
  import Test.Support.Helpers

  alias Concentrate.{DataDiscrepancy, VehiclePosition}
  alias Schedule.Trip
  alias Schedule.Gtfs.StopTime
  alias Realtime.{BlockWaiver, Vehicle}

  @vehicle_position %VehiclePosition{
    bearing: 0,
    block_id: "S28-2",
    id: "y1261",
    label: "1261",
    last_updated: 1_558_364_020,
    last_updated_by_source: %{"swiftly" => 1_558_364_020, "busloc" => 1_558_364_020},
    latitude: 42.31777347,
    license_plate: nil,
    longitude: -71.08206019,
    odometer: nil,
    operator_id: build(:operator_id),
    operator_first_name: build(:first_name),
    operator_last_name: "MAUPIN",
    operator_logon_time: 1_558_364_010,
    run_id: "138-1038",
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
    ],
    revenue: true
  }

  @trip build(
          :trip,
          id: "39984755",
          block_id: "S28-2",
          route_id: "28",
          schedule_id: "schedule",
          direction_id: 1,
          route_pattern_id: "28-_-0",
          run_id: "run1",
          stop_times: [
            build(:gtfs_stoptime, stop_id: "18511", time: 0, timepoint_id: "tp1"),
            build(:gtfs_stoptime, stop_id: "18512", time: 1, timepoint_id: nil),
            build(:gtfs_stoptime, stop_id: "18513", time: 2, timepoint_id: "tp2")
          ],
          start_time: 0,
          end_time: 2
        )

  describe "from_vehicle_position" do
    setup do
      trip = @trip

      reassign_env(:realtime, :trip_fn, fn trip_id ->
        if trip_id == trip.id do
          trip
        else
          nil
        end
      end)

      reassign_env(:realtime, :block_fn, fn schedule_id, block_id ->
        if block_id == trip.block_id and schedule_id == trip.schedule_id do
          build(:block, id: trip.block_id, pieces: [build(:piece, trips: [trip])])
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

      reassign_env(:realtime, :block_waivers_for_block_and_service_fn, fn _, _ ->
        [
          %BlockWaiver{
            start_time: 10,
            end_time: 20,
            cause_id: 26,
            cause_description: "E - Diverted",
            remark: "E:1106"
          }
        ]
      end)
    end

    test "translates Concentrate VehiclePosition into a Vehicle struct" do
      %VehiclePosition{
        operator_id: operator_id,
        operator_first_name: operator_first_name
      } = vehicle_position = @vehicle_position

      result = Vehicle.from_vehicle_position(vehicle_position)

      assert %Vehicle{
               id: "y1261",
               label: "1261",
               timestamp: 1_558_364_020,
               timestamp_by_source: %{"busloc" => 1_558_364_020},
               latitude: 42.31777347,
               longitude: -71.08206019,
               direction_id: 1,
               route_id: "28",
               route_pattern_id: "28-_-0",
               trip_id: "39984755",
               headsign: "headsign",
               via_variant: "_",
               bearing: 0,
               block_id: "S28-2",
               operator_id: ^operator_id,
               operator_first_name: ^operator_first_name,
               operator_last_name: "MAUPIN",
               operator_name: "MAUPIN",
               operator_logon_time: 1_558_364_010,
               overload_offset: nil,
               run_id: "138-1038",
               is_shuttle: false,
               is_overload: false,
               is_off_course: false,
               is_revenue: true,
               layover_departure_time: nil,
               block_is_active: true,
               sources: %MapSet{},
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
                 trip_id: "39984755",
                 run_id: "run1",
                 time_since_trip_start_time: 0,
                 headsign: "headsign",
                 via_variant: "_",
                 timepoint_status: %{
                   timepoint_id: "tp1",
                   fraction_until_timepoint: 0.0
                 }
               },
               route_status: :on_route,
               end_of_trip_type: :pull_back,
               block_waivers: [
                 %BlockWaiver{
                   remark: "E:1106"
                 }
               ]
             } = result
    end

    test "handles unknown trips" do
      reassign_env(:realtime, :trip_fn, fn _ -> nil end)
      result = Vehicle.from_vehicle_position(@vehicle_position)
      assert %Vehicle{} = result
    end

    test "handles trips with incomplete data" do
      reassign_env(:realtime, :trip_fn, fn _ ->
        %Trip{
          id: @trip.id,
          block_id: @trip.block_id
        }
      end)

      vehicle_id = @vehicle_position.id
      trip_id = @trip.id

      assert %Vehicle{id: ^vehicle_id, trip_id: ^trip_id, route_pattern_id: nil} =
               Vehicle.from_vehicle_position(@vehicle_position)
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

      assert Vehicle.off_course?(false, false, data_discrepancies)
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

      refute Vehicle.off_course?(false, false, data_discrepancies)
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

      refute Vehicle.off_course?(false, false, data_discrepancies)
    end

    test "returns false if the vehicle is logged into a shuttle run" do
      data_discrepancies = [
        %DataDiscrepancy{
          attribute: :trip_id,
          sources: [
            %{id: "swiftly", value: nil},
            %{id: "busloc", value: "busloc-trip-id"}
          ]
        }
      ]

      refute Vehicle.off_course?(false, true, data_discrepancies)
    end

    test "returns false if this vehicle is on a 'block overload'" do
      data_discrepancies = [
        %DataDiscrepancy{
          attribute: :trip_id,
          sources: [
            %{id: "swiftly", value: nil},
            %{id: "busloc", value: "busloc-trip-id"}
          ]
        }
      ]

      refute Vehicle.off_course?(true, false, data_discrepancies)
    end
  end

  describe "shuttle?/1" do
    test "returns true for a run ID starting with 999" do
      assert Vehicle.shuttle?("999-0555")
    end

    test "returns false for a run ID that doesn't start with 999" do
      refute Vehicle.shuttle?("138-1038")
    end

    test "returns false when the run ID is nil" do
      refute Vehicle.shuttle?(nil)
    end
  end

  describe "active_block?" do
    setup do
      block =
        build(
          :block,
          start_time: Util.Time.parse_hhmmss("11:01:00"),
          end_time: Util.Time.parse_hhmmss("11:59:00")
        )

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
      trip1 =
        build(
          :trip,
          id: "t1",
          block_id: "b",
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
        )

      trip2 =
        build(
          :trip,
          id: "t2",
          block_id: "b",
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
        )

      block = build(:block, id: trip1.block_id, pieces: [build(:piece, trips: [trip1, trip2])])

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
      first_trip =
        build(
          :trip,
          id: "t1",
          block_id: "b",
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
        )

      last_trip_of_run =
        build(
          :trip,
          id: "t2",
          block_id: "b",
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
        )

      last_trip_of_block =
        build(
          :trip,
          id: "t3",
          block_id: "b",
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
        )

      block =
        build(
          :block,
          id: first_trip.block_id,
          pieces: [
            build(
              :piece,
              trips: [first_trip, last_trip_of_run, last_trip_of_block]
            )
          ]
        )

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
      last_trip_of_block: last_trip_of_block,
      block: block
    } do
      assert Vehicle.end_of_trip_type(
               block,
               %{last_trip_of_block | id: "not_in_this_block"},
               "run2",
               "middle"
             ) == :another_trip
    end
  end

  describe "JSON encoding" do
    test "is encodable as JSON" do
      vehicle = %Vehicle{
        id: "y1261",
        label: "1261",
        timestamp: 1_558_364_020,
        timestamp_by_source: %{"busloc" => 1_558_364_020},
        latitude: 42.31777347,
        longitude: -71.08206019,
        direction_id: 1,
        route_id: "28",
        trip_id: "39984755",
        headsign: "headsign",
        via_variant: "_",
        bearing: 0,
        block_id: "S28-2",
        operator_id: build(:operator_id),
        operator_first_name: build(:first_name),
        operator_last_name: "MAUPIN",
        operator_name: "MAUPIN",
        operator_logon_time: 1_558_364_010,
        overload_offset: nil,
        run_id: "138-1038",
        is_shuttle: false,
        is_overload: false,
        is_off_course: false,
        is_revenue: true,
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
