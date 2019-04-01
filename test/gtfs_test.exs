defmodule GtfsTest do
  use ExUnit.Case, async: true

  alias Gtfs.Route

  doctest Gtfs

  describe "all_routes" do
    test "all_routes" do
      {:ok, pid} =
        Gtfs.start_mocked(%{
          "routes.txt" => [
            "route_id,route_long_name",
            "Red,Red Line"
          ]
        })

      assert Gtfs.all_routes(pid) == [
               %Route{id: "Red"}
             ]
    end
  end

  describe "timepoints_on_route" do
    test "timepoints_on_route" do
      {:ok, pid} =
        Gtfs.start_mocked(%{
          "trips.txt" => [
            "trip_id,route_id",
            "red-trip,Red",
            "blue-trip,Blue"
          ],
          "stop_times.txt" => [
            "trip_id,stop_id,checkpoint_id",
            "red-trip,stop,check",
            "blue-trip,stop,other"
          ]
        })

      assert Gtfs.timepoints_on_route("Red", pid) == ["check"]
    end
  end
end
