defmodule Realtime.VehicleTest do
  use ExUnit.Case, async: true

  alias Gtfs.Timepoint
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
      opts = [
        # Vehicle is traveling in the oposite direction from the way the stops are ordered
        stops_on_route_fn: fn _ -> ["6555", "6554", "6553"] end,
        timepoints_on_route_fn: fn _ ->
          [
            %Timepoint{
              id: "tp1",
              stop_id: "6553"
            },
            %Timepoint{
              id: "tp2",
              stop_id: "6555"
            }
          ]
        end
      ]

      input = Jason.decode!(@vehicle_json_string)

      assert Vehicle.decode(input, opts) == %Vehicle{
               id: "y0507",
               label: "0507",
               timestamp: 1_554_927_574,
               direction_id: 0,
               route_id: "505",
               trip_id: "39984755",
               current_status: :in_transit_to,
               stop_id: "6555",
               status: %{
                 stop_granularity: %{
                   current_status: :in_transit_to,
                   stop_id: "6555"
                 },
                 timepoint_granularity: %{
                   current_status: :in_transit_to,
                   timepoint_id: "tp2",
                   percent_of_the_way: 100
                 }
               }
             }
    end
  end

  describe "percent_of_the_way_to_next_timepoint/3" do
    test "returns 0 if the stop is a timepoint, plus the timepoint" do
      stop_ids = ["s1", "s2", "s3", "s4", "s5", "s6"]

      timepoints = [
        %Timepoint{
          id: "tp1",
          stop_id: "s1"
        },
        %Timepoint{
          id: "tp2",
          stop_id: "s6"
        }
      ]

      stop_id = "s1"

      assert Vehicle.percent_of_the_way_to_next_timepoint(stop_ids, timepoints, stop_id) == {
               0,
               %Timepoint{
                 id: "tp1",
                 stop_id: "s1"
               }
             }
    end

    test "returns the ratio of stops to next timepoint vs stops to last timepoint if the stop is not a timepoint, plus the next timepoint" do
      stop_ids = ["s1", "s2", "s3", "s4", "s5", "s6"]

      timepoints = [
        %Timepoint{
          id: "tp1",
          stop_id: "s1"
        },
        %Timepoint{
          id: "tp2",
          stop_id: "s6"
        }
      ]

      stop_id = "s3"

      assert Vehicle.percent_of_the_way_to_next_timepoint(stop_ids, timepoints, stop_id) ==
               {
                 40,
                 %Timepoint{
                   id: "tp2",
                   stop_id: "s6"
                 }
               }
    end
  end
end
