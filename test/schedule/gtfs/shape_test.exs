defmodule Schedule.Gtfs.ShapeTest do
  use ExUnit.Case, async: true

  alias Schedule.Gtfs.Shape
  alias Schedule.Gtfs.Shape.Point

  describe "Schedule.Gtfs.Shape.from_file/1" do
    test "parses shapes and organizes them by id" do
      shapes_txt =
        Enum.join(
          [
            "shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled",
            "2,22.2,-22.2,1,",
            "1,11.1,-11.1,0,",
            "2,21.2,-21.2,0,",
            "1,12.1,-12.1,1,"
          ],
          "\n"
        )

      expected = %{
        "1" => %Shape{
          id: "1",
          points: [
            %Point{
              shape_id: "1",
              lat: 11.1,
              lon: -11.1,
              sequence: 0
            },
            %Point{
              shape_id: "1",
              lat: 12.1,
              lon: -12.1,
              sequence: 1
            }
          ]
        },
        "2" => %Shape{
          id: "2",
          points: [
            %Point{
              shape_id: "2",
              lat: 21.2,
              lon: -21.2,
              sequence: 0
            },
            %Point{
              shape_id: "2",
              lat: 22.2,
              lon: -22.2,
              sequence: 1
            }
          ]
        }
      }

      assert Shape.from_file(shapes_txt) == expected
    end
  end

  describe "Schedule.Gtfs.Shape.Point.from_csv_row/1" do
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
