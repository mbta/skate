defmodule Gtfs.QueryTest do
  use ExUnit.Case, async: true

  alias Gtfs.Route

  alias Gtfs.Query

  describe "all_routes" do
    test "all_routes" do
      {:ok, pid} =
        Gtfs.start_mocked(%{
          "routes.txt" => [
            "route_id,route_long_name",
            "Red,Red Line"
          ]
        })

      assert Query.all_routes(server: pid) == [
               %Route{id: "Red"}
             ]
    end
  end
end
