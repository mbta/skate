defmodule Schedule.ShapeWithStopsTest do
  use ExUnit.Case, async: true
  alias Schedule.Gtfs.{Shape, Stop}
  alias Schedule.ShapeWithStops

  describe "create/2" do
    test "creates struct with all fields populated" do
      points = [
        %Shape.Point{
          shape_id: "shape1",
          lat: "42.413560",
          lon: "-70.992110",
          sequence: "0"
        }
      ]

      %{id: shape_id} =
        shape = %Shape{
          id: "shape1",
          points: points
        }

      stops = [
        %Stop{id: "stop1", name: "Stop One", latitude: 42.12, longitude: -71.12},
        %Stop{id: "stop2", name: "Stop Two", latitude: 42.34, longitude: -71.34}
      ]

      assert %ShapeWithStops{id: ^shape_id, points: ^points, stops: ^stops} =
               ShapeWithStops.create(shape, stops)
    end
  end
end
