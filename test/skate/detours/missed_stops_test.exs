defmodule Skate.Detours.MissedStopsTest do
  use ExUnit.Case

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

      param = %Skate.Detours.MissedStops{
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
               Skate.Detours.MissedStops.missed_stops(param)
    end

    test "returns connection points" do
      connection_stop_start = Location.new(0.001, 2)
      connection_stop_end = Location.new(0.001, 6)

      param = %Skate.Detours.MissedStops{
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
             } = Skate.Detours.MissedStops.missed_stops(param)
    end

    test "returns nil for connection_start if the first stop is missed" do
      connection_stop_end = Location.new(0.001, 7)

      param = %Skate.Detours.MissedStops{
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
             } = Skate.Detours.MissedStops.missed_stops(param)
    end

    test "returns nil for connection_end if the last stop is missed" do
      connection_stop_start = Location.new(0.001, 0)

      param = %Skate.Detours.MissedStops{
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
             } = Skate.Detours.MissedStops.missed_stops(param)
    end

    test "given a start and end connection points within the same segment, should return empty list" do
      param = %Skate.Detours.MissedStops{
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
               Skate.Detours.MissedStops.missed_stops(param)
    end

    test "given a stop that is visited twice, should return missed stops" do
      duplicate_stop = Location.new(0, 0)

      param = %Skate.Detours.MissedStops{
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
               Skate.Detours.MissedStops.missed_stops(param)

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

      param = %Skate.Detours.MissedStops{
        shape: shape,
        stops: stops,
        connection_start: Enum.at(stops, connection_start_index),
        connection_end: Enum.at(stops, connection_end_index)
      }

      assert %MissedStops.Result{missed_stops: missed_stops} =
               Skate.Detours.MissedStops.missed_stops(param)

      assert Enum.slice(stops, connection_start_index..(connection_end_index - 1)) ==
               missed_stops
    end

    test "counts stops as missed if they're just inside the detour" do
      ##                              Both stops are missed
      ##        Stops:         v(0.001, 1.1)             v(0.001, 4.9)
      ##                       o                         o
      ##
      ##               o------o------o------o------o------o------o------o
      ## Shape Points: ^(0,0) ^(0,1) ^(0,2) ^(0,3) ^(0,4) ^(0,5) ^(0,6) ^(0,7)
      ##
      ## Connection Points : o                             o
      ##                     ^(-0.001, 0.9)                ^(-0.001, 5.1)
      ##                  (connection_start)               (connection_end)
      #
      # https://excalidraw.com/#json=OrMM928mw4CR3Qy8sc6oL,sXiFCU1s-K1ugEQvgSvh3g
      stops = [
        Location.new(0.001, 1.1),
        Location.new(0.001, 4.9)
      ]

      param = %Skate.Detours.MissedStops{
        connection_start: Location.new(-0.001, 0.9),
        connection_end: Location.new(-0.001, 5.1),
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
               Skate.Detours.MissedStops.missed_stops(param)
    end

    test "does not count stops as missed if they're just outside the detour" do
      ##                             Neither stop is missed
      ##        Stops:       v(0.001, 0.9)                 v(0.001, 5.1)
      ##                     o                             o
      ##
      ##               o------o------o------o------o------o------o------o
      ## Shape Points: ^(0,0) ^(0,1) ^(0,2) ^(0,3) ^(0,4) ^(0,5) ^(0,6) ^(0,7)
      ##
      ## Connection Points :   o                         o
      ##                       ^(-0.001, 1.1)            ^(-0.001, 4.9)
      ##                    (connection_start)           (connection_end)
      #
      # https://excalidraw.com/#json=OrMM928mw4CR3Qy8sc6oL,sXiFCU1s-K1ugEQvgSvh3g

      connection_stop_start = Location.new(0.001, 0.9)
      connection_stop_end = Location.new(0.001, 5.1)

      param = %Skate.Detours.MissedStops{
        connection_start: Location.new(-0.001, 1.1),
        connection_end: Location.new(-0.001, 4.9),
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
               Skate.Detours.MissedStops.missed_stops(param)
    end
  end
end
