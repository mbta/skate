defmodule Schedule.Gtfs.RoutePatternTest do
  use ExUnit.Case, async: true

  alias Schedule.Gtfs.RoutePattern

  @csv_row %{
    "route_pattern_id" => "39-3-0",
    "route_id" => "39",
    "direction_id" => "0",
    "route_pattern_name" => "Forest Hills Station via Huntington Avenue",
    "route_pattern_time_desc" => "Mornings only",
    "route_pattern_typicality" => "1",
    "route_pattern_sort_order" => "50390004",
    "representative_trip_id" => "40044234"
  }

  describe "from_csv_row/1" do
    test "builds a RoutePattern struct from a csv row" do
      assert %RoutePattern{
               id: "39-3-0",
               name: "Forest Hills Station via Huntington Avenue",
               route_id: "39",
               direction_id: 0,
               representative_trip_id: "40044234",
               time_desc: "Mornings only",
               sort_order: 50_390_004
             } = RoutePattern.from_csv_row(@csv_row)
    end
  end

  describe "row_in_route_id_set?/2" do
    test "returns whether the row's route id is in the given set" do
      assert RoutePattern.row_in_route_id_set?(@csv_row, MapSet.new(["38", "39"]))
      refute RoutePattern.row_in_route_id_set?(@csv_row, MapSet.new(["1", "2"]))
    end
  end

  describe "via_variant/1" do
    test "gets via_variant out of route_pattern_id" do
      assert RoutePattern.via_variant("116-4-1") == "4"
    end

    test "works with underscores" do
      assert RoutePattern.via_variant("116-_-0") == "_"
    end

    test "works with route_ids that have hyphens" do
      assert RoutePattern.via_variant("Green-B-3-1") == "3"
    end
  end
end
