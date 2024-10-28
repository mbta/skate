defmodule Skate.Detours.MissedStopsTest do
  use ExUnit.Case

  alias Skate.Detours.ShapeSegment
  alias Skate.Detours.MissedStops
  alias Util.Location

  describe "missed_stops" do
    test "given a straight line, returns missed stops" do
      ##                                                 (Missed Stop)
      ##        Stops: v(0.001, 0)                        v(0.001, 5)   v(0.001, 5)
      ##               o                                  o             o
      ##
      ##               o------o------o------o------o------o------o------o
      ## Shape Points: ^(0,0) ^(0,1) ^(0,2) ^(0,3) ^(0,4) ^(0,5) ^(0,6) ^(0,7)
      ##
      ## Connection Points :  o                                  o
      ##                      ^(-0.001, 1)                       ^(-0.001, 6)
      ##                   (connection_start)                  (connection_end)
      #
      # https://excalidraw.com/#json=OrMM928mw4CR3Qy8sc6oL,sXiFCU1s-K1ugEQvgSvh3g
      missed_stop = Location.new(0.001, 5)

      param = %MissedStops{
        connection_start: Location.new(-0.001, 1),
        connection_end: Location.new(-0.001, 6),
        stops: [
          Location.new(0.001, 0),
          missed_stop,
          Location.new(0.001, 7)
        ],
        shape: [
          Location.new(0, 0),
          Location.new(0, 1),
          Location.new(0, 2),
          Location.new(0, 3),
          Location.new(0, 4),
          Location.new(0, 5),
          Location.new(0, 6),
          Location.new(0, 7)
        ]
      }

      assert %MissedStops.Result{missed_stops: [^missed_stop]} =
               MissedStops.missed_stops(param)
    end

    test "returns connection points" do
      connection_stop_start = Location.new(0.001, 2)
      connection_stop_end = Location.new(0.001, 6)

      param = %MissedStops{
        connection_start: Location.new(-0.001, 3),
        connection_end: Location.new(-0.001, 5),
        stops: [
          Location.new(0.001, 1),
          connection_stop_start,
          Location.new(0.001, 4),
          connection_stop_end,
          Location.new(0.001, 7)
        ],
        shape: [
          Location.new(0, 0),
          Location.new(0, 1),
          Location.new(0, 2),
          Location.new(0, 3),
          Location.new(0, 4),
          Location.new(0, 5),
          Location.new(0, 6),
          Location.new(0, 7)
        ]
      }

      assert %MissedStops.Result{
               connection_stop_start: ^connection_stop_start,
               connection_stop_end: ^connection_stop_end
             } = MissedStops.missed_stops(param)
    end

    test "returns nil for connection_start if the first stop is missed" do
      connection_stop_end = Location.new(0.001, 7)

      param = %MissedStops{
        connection_start: Location.new(-0.001, 1),
        connection_end: Location.new(-0.001, 6),
        stops: [
          Location.new(0.001, 5),
          connection_stop_end
        ],
        shape: [
          Location.new(0, 0),
          Location.new(0, 1),
          Location.new(0, 2),
          Location.new(0, 3),
          Location.new(0, 4),
          Location.new(0, 5),
          Location.new(0, 6),
          Location.new(0, 7)
        ]
      }

      assert %MissedStops.Result{
               connection_stop_start: nil,
               connection_stop_end: ^connection_stop_end
             } = MissedStops.missed_stops(param)
    end

    test "returns nil for connection_end if the last stop is missed" do
      connection_stop_start = Location.new(0.001, 0)

      param = %MissedStops{
        connection_start: Location.new(-0.001, 1),
        connection_end: Location.new(-0.001, 6),
        stops: [
          connection_stop_start,
          Location.new(0.001, 5)
        ],
        shape: [
          Location.new(0, 0),
          Location.new(0, 1),
          Location.new(0, 2),
          Location.new(0, 3),
          Location.new(0, 4),
          Location.new(0, 5),
          Location.new(0, 6),
          Location.new(0, 7)
        ]
      }

      assert %MissedStops.Result{
               connection_stop_start: ^connection_stop_start,
               connection_stop_end: nil
             } = MissedStops.missed_stops(param)
    end

    test "given a start and end connection points within the same segment, should return empty list" do
      param = %MissedStops{
        connection_start: Location.new(-0.001, 1),
        connection_end: Location.new(-0.001, 4),
        stops: [
          Location.new(0.001, 0),
          Location.new(0.001, 5),
          Location.new(0.001, 7)
        ],
        shape: [
          Location.new(0, 0),
          Location.new(0, 1),
          Location.new(0, 2),
          Location.new(0, 3),
          Location.new(0, 4),
          Location.new(0, 5),
          Location.new(0, 6),
          Location.new(0, 7)
        ]
      }

      assert %{missed_stops: []} =
               MissedStops.missed_stops(param)
    end

    test "given a stop that is visited twice, should return missed stops" do
      duplicate_stop = Location.new(0, 0)

      param = %MissedStops{
        connection_start: Location.new(-0.25, 0),
        connection_end: Location.new(0, -0.75),
        stops: [
          Location.new(-1, 0),
          duplicate_stop,
          Location.new(1, 1),
          duplicate_stop,
          Location.new(0, -1)
        ],
        shape: [
          Location.new(-1, 0),
          Location.new(0, 0),
          Location.new(1, 0),
          Location.new(1, 1),
          Location.new(0, 1),
          Location.new(0, 0),
          Location.new(0, -1)
        ]
      }

      assert %MissedStops.Result{missed_stops: missed_stops} =
               MissedStops.missed_stops(param)

      assert [
               duplicate_stop,
               Location.new(1, 1),
               duplicate_stop
             ] ==
               missed_stops
    end

    test "can handle real shapes and stops" do
      stops = Skate.StopShapeTestData.route_217_stops()
      shape = Skate.StopShapeTestData.route_217_shape_points()
      # Just after North Quincy's first visit
      connection_start_index = 49
      # North Quincy
      connection_end_index = 53

      param = %MissedStops{
        shape: shape,
        stops: stops,
        connection_start: Enum.at(stops, connection_start_index),
        connection_end: Enum.at(stops, connection_end_index)
      }

      assert %MissedStops.Result{missed_stops: missed_stops} =
               MissedStops.missed_stops(param)

      assert Enum.slice(stops, connection_start_index..(connection_end_index - 1)) ==
               missed_stops
    end

    test "counts stops as missed if they're just inside the detour" do
      #                               Both stops are missed
      #         Stops:         v(0.001, 1.6)             v(0.001, 5.4)
      #                           o                         o
      # 
      #                o------o------o------o------o------o------o------o
      #  Shape Points: ^(0,0) ^(0,1) ^(0,2) ^(0,3) ^(0,4) ^(0,5) ^(0,6) ^(0,7)
      # 
      #  Connection Points :    o                             o
      #                         ^(-0.001, 1.4)                ^(-0.001, 5.6)
      #                      (connection_start)               (connection_end)
      stops = [
        Location.new(0.001, 1.6),
        Location.new(0.001, 5.4)
      ]

      param = %MissedStops{
        connection_start: Location.new(-0.001, 1.4),
        connection_end: Location.new(-0.001, 5.6),
        stops: stops,
        shape: [
          Location.new(0, 0),
          Location.new(0, 1),
          Location.new(0, 2),
          Location.new(0, 3),
          Location.new(0, 4),
          Location.new(0, 5),
          Location.new(0, 6),
          Location.new(0, 7)
        ]
      }

      assert %MissedStops.Result{
               missed_stops: ^stops,
               connection_stop_start: nil,
               connection_stop_end: nil
             } =
               MissedStops.missed_stops(param)
    end

    test "does not count stops as missed if they're just outside the detour" do
      #                              Neither stop is missed
      #         Stops:          v(0.001, 1.4)                 v(0.001, 5.6)
      #                         o                             o
      # 
      #                o------o------o------o------o------o------o------o
      #  Shape Points: ^(0,0) ^(0,1) ^(0,2) ^(0,3) ^(0,4) ^(0,5) ^(0,6) ^(0,7)
      # 
      #  Connection Points :      o                         o
      #                           ^(-0.001, 1.6)            ^(-0.001, 5.4)
      #                        (connection_start)           (connection_end)

      connection_stop_start = Location.new(0.001, 1.4)
      connection_stop_end = Location.new(0.001, 5.6)

      param = %MissedStops{
        connection_start: Location.new(-0.001, 1.6),
        connection_end: Location.new(-0.001, 5.4),
        stops: [
          connection_stop_start,
          connection_stop_end
        ],
        shape: [
          Location.new(0, 0),
          Location.new(0, 1),
          Location.new(0, 2),
          Location.new(0, 3),
          Location.new(0, 4),
          Location.new(0, 5),
          Location.new(0, 6),
          Location.new(0, 7)
        ]
      }

      assert %MissedStops.Result{
               missed_stops: [],
               connection_stop_start: ^connection_stop_start,
               connection_stop_end: ^connection_stop_end
             } =
               MissedStops.missed_stops(param)
    end

    test "works even if the route shape has a long segment that includes multiple stops" do
      #
      #         Stops:   (0.001, 0.9)    (0.001, 2.5)     v(0.001, 5.1)
      #                      o             o              o
      # 
      #                o------------------------------------------------o
      #  Shape Points: ^(0,0)                                           ^(0,7)
      # 
      #  Connection Points :   o                         o
      #                        ^(-0.001, 1.1)            ^(-0.001, 4.9)
      #                     (connection_start)           (connection_end)

      connection_stop_start = Location.new(0.001, 0.9)
      missed_stop = Location.new(0.001, 2.5)
      connection_stop_end = Location.new(0.001, 5.1)

      param = %MissedStops{
        connection_start: Location.new(-0.001, 1.1),
        connection_end: Location.new(-0.001, 4.9),
        stops: [
          connection_stop_start,
          missed_stop,
          connection_stop_end
        ],
        shape: [
          Location.new(0, 0),
          Location.new(0, 7)
        ]
      }

      assert %MissedStops.Result{
               missed_stops: [^missed_stop],
               connection_stop_start: ^connection_stop_start,
               connection_stop_end: ^connection_stop_end
             } =
               MissedStops.missed_stops(param)
    end
  end

  describe "segment_shape_by_stops/2" do
    test "returns empty when there are no stops and no shape" do
      assert MissedStops.segment_shape_by_stops([], []) == []
    end

    test "returns a segment with stop=:none when there are no stops" do
      assert MissedStops.segment_shape_by_stops(
               [Location.new(0, 0), Location.new(0, 7)],
               []
             ) == [%ShapeSegment{points: [Location.new(0, 0), Location.new(0, 7)], stop: :none}]
    end

    test "partitions a straight line where the stop is" do
      assert MissedStops.segment_shape_by_stops(
               [Location.new(0, 0), Location.new(0, 7)],
               [Location.new(0.001, 3)]
             ) == [
               %ShapeSegment{
                 points: [Location.new(0, 0), Location.new(0, 3)],
                 stop: Location.new(0.001, 3)
               },
               %ShapeSegment{
                 points: [Location.new(0, 3), Location.new(0, 7)],
                 stop: :none
               }
             ]
    end

    test "works when there is more than one stop" do
      assert MissedStops.segment_shape_by_stops(
               [Location.new(0, 0), Location.new(0, 2), Location.new(0, 4), Location.new(0, 7)],
               [Location.new(0.001, 3), Location.new(0.001, 6)]
             ) == [
               %ShapeSegment{
                 points: [Location.new(0, 0), Location.new(0, 2), Location.new(0, 3)],
                 stop: Location.new(0.001, 3)
               },
               %ShapeSegment{
                 points: [Location.new(0, 3), Location.new(0, 4), Location.new(0, 6)],
                 stop: Location.new(0.001, 6)
               },
               %ShapeSegment{
                 points: [Location.new(0, 6), Location.new(0, 7)],
                 stop: :none
               }
             ]
    end

    test "works when there is a long straight section of the route" do
      assert MissedStops.segment_shape_by_stops(
               [Location.new(0, 0), Location.new(0, 7)],
               [Location.new(0.001, 3), Location.new(0.001, 6)]
             ) == [
               %ShapeSegment{
                 points: [Location.new(0, 0), Location.new(0, 3)],
                 stop: Location.new(0.001, 3)
               },
               %ShapeSegment{
                 points: [Location.new(0, 3), Location.new(0, 6)],
                 stop: Location.new(0.001, 6)
               },
               %ShapeSegment{
                 points: [Location.new(0, 6), Location.new(0, 7)],
                 stop: :none
               }
             ]
    end

    test "works when the shape loops around and an intersection stop is closer to the correct part of the route" do
      assert MissedStops.segment_shape_by_stops(
               [
                 Location.new(0, 0),
                 Location.new(0, 2),
                 Location.new(1, 1),
                 Location.new(-1, 1)
               ],
               [Location.new(0.002, 1.003), Location.new(1, 1)]
             ) == [
               %ShapeSegment{
                 points: [Location.new(0, 0), Location.new(0, 1.003)],
                 stop: Location.new(0.002, 1.003)
               },
               %ShapeSegment{
                 points: [
                   Location.new(0, 1.003),
                   Location.new(0, 2),
                   Location.new(1, 1),
                   Location.new(1, 1)
                 ],
                 stop: Location.new(1, 1)
               },
               %ShapeSegment{
                 points: [Location.new(1, 1), Location.new(-1, 1)],
                 stop: :none
               }
             ]
    end

    test "works when the shape loops around and an intersection stop is closer to the wrong part of the route" do
      assert MissedStops.segment_shape_by_stops(
               [
                 Location.new(0, 0),
                 Location.new(0, 2),
                 Location.new(1, 1),
                 Location.new(-1, 1)
               ],
               [Location.new(0.003, 1.001), Location.new(1, 1)]
             ) == [
               %ShapeSegment{
                 points: [Location.new(0, 0), Location.new(0, 1.0009999999999997)],
                 stop: Location.new(0.003, 1.001)
               },
               %ShapeSegment{
                 points: [
                   Location.new(0, 1.0009999999999997),
                   Location.new(0, 2),
                   Location.new(1, 1),
                   Location.new(1, 1)
                 ],
                 stop: Location.new(1, 1)
               },
               %ShapeSegment{
                 points: [Location.new(1, 1), Location.new(-1, 1)],
                 stop: :none
               }
             ]
    end
  end
end
