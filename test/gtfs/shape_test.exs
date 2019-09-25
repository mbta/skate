defmodule Gtfs.ShapeTest do
  use ExUnit.Case, async: true

  alias Gtfs.Shape.Point

  describe "Gtfs.Shape.Point.from_csv_row/1" do
    test "builds a Shape struct from a csv row" do
      csv_row = %{
        "shape_id" => "WonderlandToOrientHeights-S",
        "shape_pt_lat" => "42.413560",
        "shape_pt_lon" => "-70.992110",
        "shape_pt_sequence" => "0",
        "shape_dist_traveled" => "42"
      }

      assert Point.from_csv_row(csv_row) == %Point{
               shape_id: "WonderlandToOrientHeights-S",
               lat: 42.413560,
               lon: -70.992110,
               sequence: 0
             }
    end
  end
end
