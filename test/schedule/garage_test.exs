defmodule Schedule.GarageTest do
  use ExUnit.Case
  import Skate.Factory
  import ExUnit.CaptureLog

  describe "add_garages_to_routes/2" do
    test "adds garage information to routes" do
      [%Schedule.Gtfs.Route{garages: garages}] =
        Schedule.Garage.add_garages_to_routes([build(:gtfs_route, %{id: "route1"})], %{
          "1234" => build(:trip, %{id: "1234", block_id: "C12-34", route_id: "route1"}),
          "5678" => build(:trip, %{id: "5678", block_id: "C56-78", route_id: "route1"})
        })

      assert MapSet.to_list(garages) == ["Cabot"]
    end

    test "handles multiple garages per route" do
      [%Schedule.Gtfs.Route{garages: garages}] =
        Schedule.Garage.add_garages_to_routes([build(:gtfs_route, %{id: "route1"})], %{
          "1234" => build(:trip, %{id: "1234", block_id: "A12-34", route_id: "route1"}),
          "5678" => build(:trip, %{id: "5678", block_id: "C56-78", route_id: "route1"})
        })

      garage_list = MapSet.to_list(garages)

      assert Enum.count(garage_list) == 2
      assert "Albany" in garage_list
      assert "Cabot" in garage_list
    end

    test "handles unknown garage code" do
      log =
        capture_log([level: :warning], fn ->
          [%Schedule.Gtfs.Route{garages: garages}] =
            Schedule.Garage.add_garages_to_routes([build(:gtfs_route, %{id: "route1"})], %{
              "1234" => build(:trip, %{id: "1234", block_id: "X12-34", route_id: "route1"})
            })

          assert MapSet.to_list(garages) == []
        end)

      assert log =~ "Unrecognized block code"
    end

    test "silently ignores private carrier garage code" do
      log =
        capture_log([level: :warning], fn ->
          [%Schedule.Gtfs.Route{garages: garages}] =
            Schedule.Garage.add_garages_to_routes([build(:gtfs_route, %{id: "route1"})], %{
              "1234" => build(:trip, %{id: "1234", block_id: "J12-34", route_id: "route1"})
            })

          assert MapSet.to_list(garages) == []
        end)

      refute log =~ "Unrecognized block code"
    end
  end
end
