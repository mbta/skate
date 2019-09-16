defmodule Gtfs.ShapePointTest do
  use ExUnit.Case, async: true

  alias Gtfs.ShapePoint

  describe "from_csv_row" do
    test "builds a Shape struct from a csv row" do
      csv_row = %{
        "shape_id" => "WonderlandToOrientHeights-S",
        "shape_pt_lat" => "42.413560",
        "shape_pt_lon" => "-70.992110",
        "shape_pt_sequence" => "0",
        "shape_dist_traveled" => "42"
      }

      assert ShapePoint.from_csv_row(csv_row) == %ShapePoint{
               shape_id: "WonderlandToOrientHeights-S",
               lat: 42.413560,
               lon: -70.992110,
               sequence: 0
             }
    end
  end
end
