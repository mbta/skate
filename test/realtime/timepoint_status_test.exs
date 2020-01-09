defmodule Realtime.TimepointStatusTest do
  use ExUnit.Case

  alias Gtfs.{StopTime, Trip}
  alias Realtime.TimepointStatus

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

      assert TimepointStatus.timepoint_status(stop_times, stop_id) == %{
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

      assert TimepointStatus.timepoint_status(stop_times, stop_id) == %{
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

      assert TimepointStatus.timepoint_status(stop_times, stop_id) == %{
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

      assert TimepointStatus.timepoint_status(stop_times, stop_id) == nil
    end
  end

  describe "scheduled_location/2" do
    test "returns the first stop if the block hasn't started yet" do
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
              time: Util.Time.parse_hhmmss("12:01:00"),
              timepoint_id: "tp1"
            },
            %StopTime{
              stop_id: "6555",
              time: Util.Time.parse_hhmmss("12:02:00"),
              timepoint_id: "tp2"
            }
          ]
        }
      ]

      # 2019-01-01 12:00:00 EST
      now = 1_546_362_000

      assert TimepointStatus.scheduled_location(block, now) == %{
               route_id: "28",
               direction_id: 1,
               trip_id: "1",
               headsign: "headsign",
               via_variant: "_",
               timepoint_status: %{
                 timepoint_id: "tp1",
                 fraction_until_timepoint: 0.0
               }
             }
    end

    test "returns the last stop if the block is finished" do
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
              time: Util.Time.parse_hhmmss("11:02:00"),
              timepoint_id: "tp2"
            }
          ]
        }
      ]

      # 2019-01-01 12:00:00 EST
      now = 1_546_362_000

      assert TimepointStatus.scheduled_location(block, now) == %{
               route_id: "28",
               direction_id: 1,
               trip_id: "1",
               headsign: "headsign",
               via_variant: "_",
               timepoint_status: %{
                 timepoint_id: "tp2",
                 fraction_until_timepoint: 0.0
               }
             }
    end

    test "returns the last stop of the previous trip if it's in a layover" do
      block = [
        %Trip{
          id: "0",
          route_id: "28",
          service_id: "service",
          headsign: "headsign",
          direction_id: 0,
          block_id: "S28-2",
          route_pattern_id: "28-_-0",
          shape_id: "shape1",
          stop_times: [
            %StopTime{
              stop_id: "6553",
              time: Util.Time.parse_hhmmss("11:01:00"),
              timepoint_id: "tp1"
            },
            %StopTime{
              stop_id: "6555",
              time: Util.Time.parse_hhmmss("11:02:00"),
              timepoint_id: "tp2"
            }
          ]
        },
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
              time: Util.Time.parse_hhmmss("12:03:00"),
              timepoint_id: "tp3"
            }
          ]
        }
      ]

      # 2019-01-01 12:00:00 EST
      now = 1_546_362_000

      assert TimepointStatus.scheduled_location(block, now) == %{
               route_id: "28",
               direction_id: 0,
               trip_id: "0",
               headsign: "headsign",
               via_variant: "_",
               timepoint_status: %{
                 timepoint_id: "tp2",
                 fraction_until_timepoint: 0.0
               }
             }
    end

    test "returns the next timepoint it's scheduled to be at if in the middle of a trip" do
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
            %StopTime{stop_id: "1", time: Util.Time.parse_hhmmss("12:05:00"), timepoint_id: "1"},
            %StopTime{stop_id: "2", time: Util.Time.parse_hhmmss("12:10:00"), timepoint_id: "2"},
            %StopTime{stop_id: "3", time: Util.Time.parse_hhmmss("12:20:00"), timepoint_id: "3"}
          ]
        }
      ]

      # 2019-01-01 12:17:30 EST
      now = 1_546_363_050

      assert TimepointStatus.scheduled_location(block, now) == %{
               route_id: "28",
               direction_id: 1,
               trip_id: "1",
               headsign: "headsign",
               via_variant: "_",
               timepoint_status: %{
                 timepoint_id: "3",
                 fraction_until_timepoint: 0.25
               }
             }
    end

    test "returns nil if we can't find the block" do
      # 2019-01-01 12:00:00 EST
      now = 1_546_362_000
      assert TimepointStatus.scheduled_location(nil, now) == nil
    end
  end
end
