defmodule Realtime.VehicleTest do
  use ExUnit.Case, async: true

  alias Gtfs.Trip
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
      real_trip_fn = Application.get_env(:realtime, :trip_fn)

      on_exit(fn ->
        Application.put_env(:realtime, :trip_fn, real_trip_fn)
      end)

      Application.put_env(:realtime, :trip_fn, fn "39984755" ->
        %Trip{
          id: "39984755",
          route_id: "505",
          headsign: "headsign",
          route_pattern_id: "505-_-0",
          stop_times: [
            %StopTime{stop_id: "6553", timepoint_id: "tp1"},
            %StopTime{stop_id: "6554", timepoint_id: nil},
            %StopTime{stop_id: "6555", timepoint_id: "tp2"}
          ]
        }
      end)

      input = Jason.decode!(@vehicle_json_string)

      assert Vehicle.decode(input) == %Vehicle{
               id: "y0507",
               label: "0507",
               timestamp: 1_554_927_574,
               latitude: 42.35277354,
               longitude: -71.0593878,
               direction_id: 0,
               route_id: "505",
               trip_id: "39984755",
               headsign: "headsign",
               via_variant: "_",
               stop_status: %{
                 status: :in_transit_to,
                 stop_id: "6555"
               },
               timepoint_status: %{
                 timepoint_id: "tp2",
                 fraction_until_timepoint: 0.0
               }
             }
    end
  end

  describe "timepoint_status/3" do
    test "returns 0.0 if the stop is a timepoint, plus the timepoint" do
      stop_times = [
        %StopTime{
          stop_id: "s1",
          timepoint_id: "tp1"
        },
        %StopTime{
          stop_id: "s2",
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s3",
          timepoint_id: "tp3"
        },
        %StopTime{
          stop_id: "s4",
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s5",
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s6",
          timepoint_id: "tp2"
        }
      ]

      stop_id = "s3"

      assert Vehicle.timepoint_status(stop_times, stop_id) == %{
               timepoint_id: "tp3",
               fraction_until_timepoint: 0.0
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
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s3",
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s4",
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s5",
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s6",
          timepoint_id: "tp2"
        }
      ]

      stop_id = "s3"

      assert Vehicle.timepoint_status(stop_times, stop_id) == %{
               timepoint_id: "tp2",
               fraction_until_timepoint: 0.6
             }
    end

    test "returns 0.0 if the stop is the first timepoint" do
      stop_times = [
        %StopTime{
          stop_id: "s1",
          timepoint_id: "tp1"
        },
        %StopTime{
          stop_id: "s2",
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s3",
          timepoint_id: "tp3"
        }
      ]

      stop_id = "s1"

      assert Vehicle.timepoint_status(stop_times, stop_id) == %{
               timepoint_id: "tp1",
               fraction_until_timepoint: 0.0
             }
    end

    test "returns nil if on a route without timepoints" do
      stop_times = [
        %StopTime{
          stop_id: "s1",
          timepoint_id: nil
        },
        %StopTime{
          stop_id: "s2",
          timepoint_id: nil
        }
      ]

      stop_id = "s2"

      assert Vehicle.timepoint_status(stop_times, stop_id) == nil
    end
  end
end
