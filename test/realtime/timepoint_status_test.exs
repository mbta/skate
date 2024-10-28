defmodule Realtime.TimepointStatusTest do
  use ExUnit.Case

  import Skate.Factory
  import Test.Support.Helpers

  alias Schedule.Gtfs.{Stop, StopTime}
  alias Realtime.TimepointStatus

  describe "timepoint_status" do
    test "returns 0.0 if the stop is a timepoint, plus the timepoint" do
      reassign_env(:skate, :stop_fn, fn _ -> nil end)

      stop_times = [
        %StopTime{
          stop_id: "s1",
          time: 0,
          timepoint_id: "first"
        },
        %StopTime{
          stop_id: "s2",
          time: 0,
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s3",
          time: 0,
          timepoint_id: "middle"
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
          timepoint_id: "last"
        }
      ]

      assert TimepointStatus.timepoint_status(stop_times, "s1", {0.0, 0.0}) == %{
               timepoint_id: "first",
               fraction_until_timepoint: 0.0
             }

      assert TimepointStatus.timepoint_status(stop_times, "s3", {0.0, 0.0}) == %{
               timepoint_id: "middle",
               fraction_until_timepoint: 0.0
             }

      assert TimepointStatus.timepoint_status(stop_times, "s6", {0.0, 0.0}) == %{
               timepoint_id: "last",
               fraction_until_timepoint: 0.0
             }
    end

    test "returns the ratio of stops to next timepoint vs stops to last timepoint if the stop is not a timepoint, plus the next timepoint" do
      reassign_env(:skate, :stop_fn, fn _ -> nil end)

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

      assert TimepointStatus.timepoint_status(stop_times, stop_id, {0.0, 0.0}) == %{
               timepoint_id: "tp2",
               fraction_until_timepoint: 0.6
             }
    end

    test "takes into account the position between the stops" do
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
          timepoint_id: "tp2"
        }
      ]

      reassign_env(:skate, :stop_fn, fn stop_id ->
        case stop_id do
          "s2" ->
            %Stop{
              id: "s2",
              name: "s2",
              latitude: 42.0,
              longitude: -72.0
            }

          "s3" ->
            %Stop{
              id: "s3",
              name: "s3",
              latitude: 43.0,
              longitude: -71.0
            }
        end
      end)

      assert TimepointStatus.timepoint_status(stop_times, "s3", {42.75, -71.25}) == %{
               timepoint_id: "tp2",
               fraction_until_timepoint: 0.125
             }
    end

    test "returns nil if on a route without timepoints" do
      reassign_env(:skate, :stop_fn, fn _ -> nil end)

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

      assert TimepointStatus.timepoint_status(stop_times, stop_id, {0.0, 0.0}) == nil
    end
  end

  describe "fraction_between_stops" do
    setup do
      stop1 = %Stop{
        id: "stop1",
        name: "stop1",
        latitude: 42.0,
        longitude: -72.0
      }

      stop2 = %Stop{
        id: "stop2",
        name: "stop2",
        latitude: 43.0,
        longitude: -71.0
      }

      stop_without_latlon = %Stop{
        id: "without_latlon",
        name: "without_latlon"
      }

      reassign_env(:skate, :stop_fn, fn stop_id ->
        case stop_id do
          "stop1" -> stop1
          "stop2" -> stop2
          "without_latlon" -> stop_without_latlon
          "missing" -> nil
        end
      end)
    end

    test "if either stop or latlon is missing, default to 1.0 (at the second stop)" do
      latlon = {42.5, -71.5}
      assert TimepointStatus.fraction_between_stops(latlon, "stop1", nil) == 1.0
      assert TimepointStatus.fraction_between_stops(latlon, "stop1", "missing") == 1.0
      assert TimepointStatus.fraction_between_stops(latlon, "stop1", "without_latlon") == 1.0
      assert TimepointStatus.fraction_between_stops(latlon, nil, "stop1") == 1.0
      assert TimepointStatus.fraction_between_stops(latlon, "missing", "stop1") == 1.0
      assert TimepointStatus.fraction_between_stops(latlon, "without_latlon", "stop1") == 1.0
    end

    test "returns a fraction when the bus is directly between the points" do
      assert TimepointStatus.fraction_between_stops({42.75, -71.25}, "stop1", "stop2") == 0.75
    end

    test "returns a fraction when the bus is not between the points" do
      assert TimepointStatus.fraction_between_stops({42.0, -71.0}, "stop1", "stop2") == 0.5
    end

    test "the bus can't be before the first stop or after the second" do
      assert TimepointStatus.fraction_between_stops({41.0, -73.0}, "stop1", "stop2") == 0.0
      assert TimepointStatus.fraction_between_stops({44.0, -70.0}, "stop1", "stop2") == 1.0
    end
  end

  describe "scheduled_location/2" do
    setup do
      # 2019-01-01 12:00:00 EST
      time0 = 1_546_362_000
      time_of_day0 = Util.Time.parse_hhmmss("12:00:00")

      trip0 =
        build(
          :trip,
          id: "0",
          route_id: "28",
          headsign: "headsign0",
          route_pattern_id: "28-_-1",
          stop_times: [
            build(
              :gtfs_stoptime,
              stop_id: "3",
              time: time_of_day0 + 3,
              timepoint_id: "tp3"
            ),
            build(
              :gtfs_stoptime,
              stop_id: "5",
              time: time_of_day0 + 5,
              timepoint_id: "tp5"
            )
          ],
          start_time: time_of_day0 + 3,
          end_time: time_of_day0 + 5
        )

      trip1 =
        build(
          :trip,
          id: "1",
          block_id: "S28-2",
          route_id: "28",
          headsign: "headsign1",
          direction_id: 1,
          route_pattern_id: "28-_-1",
          stop_times: [
            build(:gtfs_stoptime, stop_id: "7", time: time_of_day0 + 7, timepoint_id: "tp7"),
            build(:gtfs_stoptime, stop_id: "9", time: time_of_day0 + 9, timepoint_id: nil),
            build(:gtfs_stoptime, stop_id: "11", time: time_of_day0 + 11, timepoint_id: "tp11")
          ],
          start_time: time_of_day0 + 7,
          end_time: time_of_day0 + 11
        )

      block =
        build(
          :block,
          start_time: time_of_day0 + 1,
          end_time: time_of_day0 + 13,
          pieces: [build(:piece, trips: [trip0, trip1])]
        )

      %{block: block, time0: time0}
    end

    test "returns the first stop if the block hasn't started yet", %{block: block, time0: time0} do
      now = time0

      assert TimepointStatus.scheduled_location(block, now) == %{
               route_id: "28",
               route_pattern_id: "28-_-1",
               direction_id: 0,
               trip_id: "0",
               run_id: "run",
               time_since_trip_start_time: 0 - 3,
               headsign: "headsign0",
               via_variant: "_",
               timepoint_status: %{
                 timepoint_id: "tp3",
                 fraction_until_timepoint: 0.0
               }
             }
    end

    test "returns the first stop if the block is scheduled to be pulling out", %{
      block: block,
      time0: time0
    } do
      now = time0 + 2

      assert TimepointStatus.scheduled_location(block, now) == %{
               route_id: "28",
               route_pattern_id: "28-_-1",
               direction_id: 0,
               trip_id: "0",
               run_id: "run",
               time_since_trip_start_time: 2 - 3,
               headsign: "headsign0",
               via_variant: "_",
               timepoint_status: %{
                 timepoint_id: "tp3",
                 fraction_until_timepoint: 0.0
               }
             }
    end

    test "returns the last stop if the block is scheduled to be pulling back", %{
      block: block,
      time0: time0
    } do
      now = time0 + 12

      assert TimepointStatus.scheduled_location(block, now) == %{
               route_id: "28",
               route_pattern_id: "28-_-1",
               direction_id: 1,
               trip_id: "1",
               run_id: "run",
               time_since_trip_start_time: 12 - 7,
               headsign: "headsign1",
               via_variant: "_",
               timepoint_status: %{
                 timepoint_id: "tp11",
                 fraction_until_timepoint: 0.0
               }
             }
    end

    test "returns the last stop if the block has finished", %{block: block, time0: time0} do
      now = time0 + 15

      assert TimepointStatus.scheduled_location(block, now) == %{
               route_id: "28",
               route_pattern_id: "28-_-1",
               direction_id: 1,
               trip_id: "1",
               run_id: "run",
               time_since_trip_start_time: 15 - 7,
               headsign: "headsign1",
               via_variant: "_",
               timepoint_status: %{
                 timepoint_id: "tp11",
                 fraction_until_timepoint: 0.0
               }
             }
    end

    test "returns the first stop of the next trip if it's in a layover", %{
      block: block,
      time0: time0
    } do
      now = time0 + 6

      assert TimepointStatus.scheduled_location(block, now) == %{
               route_id: "28",
               route_pattern_id: "28-_-1",
               direction_id: 1,
               trip_id: "1",
               run_id: "run",
               time_since_trip_start_time: 6 - 7,
               headsign: "headsign1",
               via_variant: "_",
               timepoint_status: %{
                 timepoint_id: "tp7",
                 fraction_until_timepoint: 0.0
               }
             }
    end

    test "returns the next timepoint it's scheduled to be at if in the middle of a trip", %{
      block: block,
      time0: time0
    } do
      now = time0 + 10

      assert TimepointStatus.scheduled_location(block, now) == %{
               route_id: "28",
               route_pattern_id: "28-_-1",
               direction_id: 1,
               trip_id: "1",
               run_id: "run",
               time_since_trip_start_time: 10 - 7,
               headsign: "headsign1",
               via_variant: "_",
               timepoint_status: %{
                 timepoint_id: "tp11",
                 fraction_until_timepoint: 0.25
               }
             }
    end

    test "returns nil if we can't find the block", %{time0: time0} do
      now = time0
      assert TimepointStatus.scheduled_location(nil, now) == nil
    end
  end
end
