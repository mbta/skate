defmodule Schedule.GarageTest do
  use ExUnit.Case
  import Skate.Factory
  import ExUnit.CaptureLog

  describe "garage_for_block/1" do
    test "uses the assigned block's garage code" do
      assert Schedule.Garage.garage_for_block("C12-34") == "Cabot"
      assert Schedule.Garage.garage_for_block("D12-34") == "Cabot / Albany"
    end

    test "handles missing and private carrier blocks" do
      for block_id <- [nil, "", "P12-34", "J12-34"] do
        assert Schedule.Garage.garage_for_block(block_id) == nil
      end
    end

    test "logs unknown block codes" do
      assert capture_log(fn ->
               assert Schedule.Garage.garage_for_block("X12-34") == nil
             end) =~ "Unrecognized block code"
    end
  end

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
