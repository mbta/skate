defmodule Schedule.TimepointOrderTest do
  use ExUnit.Case, async: true

  alias Schedule.Gtfs.RoutePattern
  alias Schedule.Gtfs.StopTime
  alias Schedule.Gtfs.Timepoint
  alias Schedule.TimepointOrder

  describe "timepoints_for_routes" do
    test "returns all timepoint IDs for all routes (either direction), sorted" do
      route_patterns = [
        %RoutePattern{
          id: "rp1",
          name: "rp1",
          route_id: "r1",
          direction_id: 0,
          representative_trip_id: "t1"
        },
        %RoutePattern{
          id: "rp2",
          name: "rp2",
          route_id: "r2",
          direction_id: 1,
          representative_trip_id: "t2"
        },
        %RoutePattern{
          id: "rp3",
          name: "rp3",
          route_id: "r1",
          direction_id: 1,
          representative_trip_id: "t3"
        }
      ]

      stop_times_by_id = %{
        "t1" => [
          %StopTime{stop_id: "s1", time: 1, timepoint_id: "tp1"},
          %StopTime{stop_id: "s7", time: 2, timepoint_id: nil}
        ],
        "t2" => [
          %StopTime{stop_id: "s2", time: 1, timepoint_id: "tp2"},
          %StopTime{stop_id: "s3", time: 2, timepoint_id: "tp3"}
        ],
        "t3" => [
          %StopTime{stop_id: "s4", time: 1, timepoint_id: "tp4"},
          %StopTime{stop_id: "s5", time: 2, timepoint_id: "tp1"}
        ]
      }

      timepoints_by_id = %{
        "tp1" => %Timepoint{id: "tp1", name: "tp1 name"},
        "tp2" => %Timepoint{id: "tp2", name: "tp2 name"},
        "tp3" => %Timepoint{id: "tp3", name: "tp3 name"},
        "tp4" => %Timepoint{id: "tp4", name: "tp4 name"}
      }

      assert TimepointOrder.timepoints_for_routes(
               route_patterns,
               stop_times_by_id,
               timepoints_by_id
             ) == %{
               "r1" => [
                 %Timepoint{id: "tp4", name: "tp4 name"},
                 %Timepoint{id: "tp1", name: "tp1 name"}
               ],
               "r2" => [
                 %Timepoint{id: "tp2", name: "tp2 name"},
                 %Timepoint{id: "tp3", name: "tp3 name"}
               ]
             }
    end
  end

  describe "timepoint_ids_for_route" do
    test "groups timepoints together even when they're on different stops" do
      route_patterns = [
        %RoutePattern{
          id: "rp1",
          name: "rp1",
          route_id: "r1",
          direction_id: 1,
          representative_trip_id: "t1"
        },
        %RoutePattern{
          id: "rp2",
          name: "rp2",
          route_id: "r1",
          direction_id: 1,
          representative_trip_id: "t2"
        }
      ]

      stop_times_by_id = %{
        "t1" => [
          %StopTime{stop_id: "s1", time: 1, timepoint_id: "tp1"},
          %StopTime{stop_id: "s3b", time: 2, timepoint_id: "tp3"}
        ],
        "t2" => [
          %StopTime{stop_id: "s1", time: 1, timepoint_id: "tp1"},
          %StopTime{stop_id: "s2", time: 2, timepoint_id: "tp2"},
          %StopTime{stop_id: "s3a", time: 3, timepoint_id: "tp3"},
          %StopTime{stop_id: "s4", time: 4, timepoint_id: "tp4"}
        ]
      }

      assert TimepointOrder.timepoint_ids_for_route(route_patterns, stop_times_by_id) == [
               "tp1",
               "tp2",
               "tp3",
               "tp4"
             ]
    end

    test "flips timepoints from trips in the 1 to 0 direction" do
      route_patterns = [
        %RoutePattern{
          id: "rp",
          name: "rp",
          route_id: "r",
          direction_id: 0,
          representative_trip_id: "t"
        }
      ]

      stop_times_by_id = %{
        "t" => [
          %StopTime{stop_id: "s1", time: 1, timepoint_id: "tp1"},
          %StopTime{stop_id: "s2", time: 2, timepoint_id: "tp2"}
        ]
      }

      assert TimepointOrder.timepoint_ids_for_route(route_patterns, stop_times_by_id) == [
               "tp2",
               "tp1"
             ]
    end
  end
end
