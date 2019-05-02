defmodule Realtime.VehicleTest do
  use ExUnit.Case, async: true

  alias Gtfs.StopTime
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
      real_stop_times_on_trip_fn = Application.get_env(:realtime, :stop_times_on_trip_fn)

      on_exit(fn ->
        Application.put_env(:realtime, :stop_times_on_trip_fn, real_stop_times_on_trip_fn)
      end)

      Application.put_env(:realtime, :stop_times_on_trip_fn, fn _trip_id ->
        [
          %StopTime{stop_id: "6553", timepoint_id: "tp1"},
          %StopTime{stop_id: "6554", timepoint_id: ""},
          %StopTime{stop_id: "6555", timepoint_id: "tp2"}
        ]
      end)

      input = Jason.decode!(@vehicle_json_string)

      assert Vehicle.decode(input) == %Vehicle{
               id: "y0507",
               label: "0507",
               timestamp: 1_554_927_574,
               direction_id: 0,
               route_id: "505",
               trip_id: "39984755",
               current_stop_status: :in_transit_to,
               stop_id: "6555",
               current_timepoint_status: :in_transit_to,
               timepoint_id: "tp2",
               percent_of_the_way_to_timepoint: 100
             }
    end
  end

  describe "percent_of_the_way_to_next_timepoint/3" do
    test "returns 0 if the stop is a timepoint, plus the timepoint" do
      stop_times = [
        %StopTime{
          stop_id: "s1",
          timepoint_id: "tp1"
        },
        %StopTime{
          stop_id: "s2",
          timepoint_id: ""
        },
        %StopTime{
          stop_id: "s3",
          timepoint_id: ""
        },
        %StopTime{
          stop_id: "s4",
          timepoint_id: ""
        },
        %StopTime{
          stop_id: "s5",
          timepoint_id: ""
        },
        %StopTime{
          stop_id: "s6",
          timepoint_id: "tp2"
        }
      ]

      stop_id = "s1"

      assert Vehicle.percent_of_the_way_to_next_timepoint(stop_times, stop_id) == {
               0,
               %StopTime{
                 stop_id: "s1",
                 timepoint_id: "tp1"
               }
             }
    end

    test "returns the ratio of stops to next timepoint vs stops to last timepoint if the stop is not a timepoint, plus the next timepoint" do
      stop_times = [
        %StopTime{
          stop_id: "s1",
          timepoint_id: "tp1"
        },
        %StopTime{
          stop_id: "s2",
          timepoint_id: ""
        },
        %StopTime{
          stop_id: "s3",
          timepoint_id: ""
        },
        %StopTime{
          stop_id: "s4",
          timepoint_id: ""
        },
        %StopTime{
          stop_id: "s5",
          timepoint_id: ""
        },
        %StopTime{
          stop_id: "s6",
          timepoint_id: "tp2"
        }
      ]

      stop_id = "s3"

      assert Vehicle.percent_of_the_way_to_next_timepoint(stop_times, stop_id) ==
               {
                 40,
                 %StopTime{
                   stop_id: "s6",
                   timepoint_id: "tp2"
                 }
               }
    end
  end
end
