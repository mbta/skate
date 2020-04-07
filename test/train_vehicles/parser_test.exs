defmodule TrainVehicles.ParserTest do
  use ExUnit.Case, async: true
  alias TrainVehicles.{Parser, TrainVehicle}

  @item %JsonApi.Item{
    attributes: %{
      "current_status" => "STOPPED_AT",
      "direction_id" => 1,
      "longitude" => 1.1,
      "latitude" => 2.2,
      "bearing" => 140
    },
    id: "y1799",
    relationships: %{
      "route" => [%JsonApi.Item{id: "1"}],
      "stop" => [%JsonApi.Item{id: "72"}],
      "trip" => [
        %JsonApi.Item{
          id: "32893540",
          relationships: %{
            "shape" => [%{id: "12345"}]
          }
        }
      ]
    },
    type: "vehicle"
  }

  describe "parse/1" do
    test "parses an API response into a TrainVehicle struct" do
      expected = %TrainVehicle{
        id: "y1799",
        route_id: "1",
        direction_id: 1,
        latitude: 2.2,
        longitude: 1.1,
        bearing: 140
      }

      assert Parser.parse(@item) == expected
    end

    test "can handle a missing route" do
      item = put_in(@item.relationships["route"], [])

      expected = %TrainVehicle{
        id: "y1799",
        route_id: nil,
        direction_id: 1,
        latitude: 2.2,
        longitude: 1.1,
        bearing: 140
      }

      assert Parser.parse(item) == expected
    end
  end
end
