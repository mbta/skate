defmodule Gtfs.RoutePatternTest do
  use ExUnit.Case, async: true

  alias Gtfs.RoutePattern

  @csv_row %{
    "route_pattern_id" => "39-3-0",
    "route_id" => "39",
    "direction_id" => "0",
    "route_pattern_name" => "Forest Hills Station via Huntington Avenue",
    "route_pattern_time_desc" => "",
    "route_pattern_typicality" => "1",
    "route_pattern_sort_order" => "50390004",
    "representative_trip_id" => "40044234"
  }

  describe "from_csv_row/1" do
    test "builds a RoutePattern struct from a csv row" do
      assert %RoutePattern{
               id: "39-3-0",
               route_id: "39",
               direction_id: 0,
               representative_trip_id: "40044234"
             } = RoutePattern.from_csv_row(@csv_row)
    end
  end

  describe "row_in_route_id_set?/2" do
    test "returns whether the row's route id is in the given set" do
      assert RoutePattern.row_in_route_id_set?(@csv_row, MapSet.new(["38", "39"]))
      refute RoutePattern.row_in_route_id_set?(@csv_row, MapSet.new(["1", "2"]))
    end
  end
end
