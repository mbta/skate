defmodule Schedule.Health.Checkers.TripStopTimesCheckerTest do
  use ExUnit.Case
  import Test.Support.Helpers

  import ExUnit.CaptureLog
  require Logger

  alias Schedule.Gtfs.{RoutePattern, StopTime}
  alias Schedule.Health.Checkers.TripStopTimesChecker
  alias Schedule.Trip

  describe "healthy?/1" do
    setup do
      reassign_env(:skate_web, :first_route_pattern_for_route_and_direction_fn, fn _route_id,
                                                                                   _direction ->
        %RoutePattern{
          id: "rp1",
          name: "rp1",
          route_id: "route1",
          direction_id: 0,
          representative_trip_id: "39984755"
        }
      end)

      reassign_env(:realtime, :trip_fn, fn _trip_id ->
        %Trip{
          id: "39984755",
          route_id: "28",
          block_id: "S28-2",
          stop_times: [
            %StopTime{stop_id: "18511", time: 0, timepoint_id: "tp1"},
            %StopTime{stop_id: "18512", time: 1, timepoint_id: nil},
            %StopTime{stop_id: "18513", time: 2, timepoint_id: "tp2"}
          ]
        }
      end)
    end

    test "checks if Schedule returns at least the configured min number of stop times per representative trip for each route" do
      assert TripStopTimesChecker.healthy?([
               %{route_id: "1", min_length: 3},
               %{route_id: "2", min_length: 3}
             ])

      refute TripStopTimesChecker.healthy?([
               %{route_id: "1", min_length: 3},
               %{route_id: "2", min_length: 4}
             ])
    end

    test "verify logging when health checker fails" do
      assert capture_log(fn ->
               TripStopTimesChecker.healthy?([
                 %{route_id: "1", min_length: 3},
                 %{route_id: "2", min_length: 4}
               ])
             end) =~
               "failed on trip_id=39984755 of route_id=2. min_length=4 length=3"
    end
  end
end
