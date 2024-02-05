defmodule Skate.Detours.MissedStopsTest do
  use ExUnit.Case

  alias Util.Location

  describe "missed_stops" do
    test "given a straight line, should return missed stops" do
      param = %Skate.Detours.MissedStops{
        connection_start: Location.new(-0.001, 1),
        connection_end: Location.new(-0.001, 6),
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

      assert [
               Location.new(0.001, 5)
             ] == Skate.Detours.MissedStops.missed_stops(param)
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

      assert [] == Skate.Detours.MissedStops.missed_stops(param)
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

      assert Enum.slice(param.stops, 1..3) ==
               Skate.Detours.MissedStops.missed_stops(param)
    end
  end
end
