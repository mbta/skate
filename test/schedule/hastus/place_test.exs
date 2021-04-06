defmodule Schedule.Hastus.PlaceTest do
  use ExUnit.Case

  describe "map_input_place_id/1" do
    test "transforms dudly to nubn" do
      assert Schedule.Hastus.Place.map_input_place_id("dudly") == "nubn"
    end

    test "passes other places through unchanged" do
      assert Schedule.Hastus.Place.map_input_place_id("ncamb") == "ncamb"
    end
  end
end
