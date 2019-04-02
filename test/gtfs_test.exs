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
end
