defmodule Realtime.VehicleTest do
  use ExUnit.Case, async: true

  alias Realtime.Vehicle

  @vehicle_json_string """
  {
    "id": "y0507",
    "vehicle": {
      "current_status": "IN_TRANSIT_TO",
      "current_stop_sequence": 3,
      "position": {
        "bearing": 0,
        "latitude": 42.35277354,
        "longitude": -71.0593878
      },
      "stop_id": "6555",
      "timestamp": 1554927574,
      "trip": {
        "direction_id": 0,
        "route_id": "505",
        "schedule_relationship": "SCHEDULED",
        "start_date": "20190410",
        "trip_id": "39984755"
      },
      "vehicle": { "id": "y0507", "label": "0507" }
    }
  }
  """

  describe "decode/1" do
    test "translates JSON data into a Vehicle struct" do
      input = Jason.decode!(@vehicle_json_string)

      assert %Vehicle{
               id: "y0507",
               label: "0507",
               timestamp: 1_554_927_574,
               direction_id: 0,
               route_id: "505",
               trip_id: "39984755",
               current_status: :in_transit_to,
               stop_id: "6555"
             } = Vehicle.decode(input)
    end
  end
end
