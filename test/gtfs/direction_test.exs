defmodule Gtfs.DirectionTest do
  use ExUnit.Case, async: true

  alias Gtfs.Direction

  doctest Direction

  describe "from_csv_row/1" do
    test "builds a Direction struct from a csv row" do
      csv_row = %{
        "route_id" => "66",
        "direction_id" => "0",
        "direction" => "Outbound",
        "direction_destination" => "Harvard"
      }

      expected = %Direction{
        route_id: "66",
        direction_id: 0,
        direction_name: "Outbound",
        direction_destination: "Harvard"
      }

      assert Direction.from_csv_row(csv_row) == expected
    end
  end
end
