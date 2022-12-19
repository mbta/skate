defmodule Schedule.Gtfs.StopTimeTest do
  use ExUnit.Case, async: true

  alias Schedule.Gtfs.StopTime

  @csv_rows [
    %{
      "trip_id" => "39770780",
      "arrival_time" => "05:19:00",
      "departure_time" => "05:19:00",
      "stop_id" => "64",
      "stop_sequence" => "1",
      "stop_headsign" => "",
      "pickup_type" => "0",
      "drop_off_type" => "1",
      "timepoint" => "1",
      "checkpoint_id" => "dudly"
    },
    %{
      "trip_id" => "39770780",
      "arrival_time" => "05:20:00",
      "departure_time" => "05:20:00",
      "stop_id" => "3",
      "stop_sequence" => "2",
      "stop_headsign" => "",
      "pickup_type" => "0",
      "drop_off_type" => "0",
      "timepoint" => "0",
      "checkpoint_id" => "melwa"
    },
    %{
      "trip_id" => "39770780",
      "arrival_time" => "05:20:00",
      "departure_time" => "05:20:00",
      "stop_id" => "4",
      "stop_sequence" => "10",
      "stop_headsign" => "",
      "pickup_type" => "0",
      "drop_off_type" => "0",
      "timepoint" => "0",
      "checkpoint_id" => "tenner"
    },
    %{
      "trip_id" => "39770783",
      "arrival_time" => "10:15:00",
      "departure_time" => "10:15:00",
      "stop_id" => "23391",
      "stop_sequence" => "1",
      "stop_headsign" => "",
      "pickup_type" => "0",
      "drop_off_type" => "1",
      "timepoint" => "1",
      "checkpoint_id" => "bbsta"
    },
    %{
      "trip_id" => "39770783",
      "arrival_time" => "10:17:00",
      "departure_time" => "10:17:00",
      "stop_id" => "173",
      "stop_sequence" => "2",
      "stop_headsign" => "",
      "pickup_type" => "0",
      "drop_off_type" => "0",
      "timepoint" => "0",
      "checkpoint_id" => ""
    },
    %{
      "trip_id" => "39770783",
      "arrival_time" => "10:20:00",
      "departure_time" => "10:20:00",
      "stop_id" => "11388",
      "stop_sequence" => "4",
      "stop_headsign" => "",
      "pickup_type" => "0",
      "drop_off_type" => "0",
      "timepoint" => "0",
      "checkpoint_id" => "hunbv"
    }
  ]

  describe "trip_stop_times_from_csv/1" do
    test "builds a trip stops map from a list of stop time csv rows" do
      assert StopTime.trip_stop_times_from_csv(@csv_rows) == %{
               "39770780" => [
                 %StopTime{stop_id: "64", time: 19140, timepoint_id: "dudly"},
                 %StopTime{stop_id: "3", time: 19200, timepoint_id: "melwa"},
                 %StopTime{stop_id: "4", time: 19200, timepoint_id: "tenner"}
               ],
               "39770783" => [
                 %StopTime{stop_id: "23391", time: 36900, timepoint_id: "bbsta"},
                 # Does not allow empty strings for timepoint_id
                 %StopTime{stop_id: "173", time: 37020, timepoint_id: nil},
                 %StopTime{stop_id: "11388", time: 37200, timepoint_id: "hunbv"}
               ]
             }
    end

    test "if arrival_time or departure_time is missing, uses the other" do
      csv_rows = [
        %{
          "trip_id" => "trip",
          "arrival_time" => "05:00:01",
          "departure_time" => "",
          "stop_id" => "64",
          "stop_sequence" => "1",
          "stop_headsign" => "",
          "pickup_type" => "0",
          "drop_off_type" => "1",
          "timepoint" => "1",
          "checkpoint_id" => "dudly"
        },
        %{
          "trip_id" => "trip",
          "arrival_time" => "",
          "departure_time" => "05:00:02",
          "stop_id" => "3",
          "stop_sequence" => "2",
          "stop_headsign" => "",
          "pickup_type" => "0",
          "drop_off_type" => "0",
          "timepoint" => "0",
          "checkpoint_id" => "melwa"
        },
        %{
          "trip_id" => "trip",
          "arrival_time" => "05:00:03",
          "departure_time" => "05:00:03",
          "stop_id" => "4",
          "stop_sequence" => "10",
          "stop_headsign" => "",
          "pickup_type" => "0",
          "drop_off_type" => "0",
          "timepoint" => "0",
          "checkpoint_id" => "tenner"
        }
      ]

      assert %{
               "trip" => [
                 %StopTime{time: 18001},
                 %StopTime{time: 18002},
                 %StopTime{time: 18003}
               ]
             } = StopTime.trip_stop_times_from_csv(csv_rows)
    end
  end

  describe "stop_sequence_integer/1" do
    test "returns the stop_sequence value as an integer" do
      assert StopTime.stop_sequence_integer(List.first(@csv_rows)) == 1
    end
  end

  describe "is_timepoint?/1" do
    test "returns true if there is a timepoint_id" do
      stop_time_with_timepoint = %StopTime{stop_id: "s1", time: 1, timepoint_id: "tmpt"}
      stop_time_without_timepoint = %StopTime{stop_id: "s2", time: 2, timepoint_id: nil}

      assert StopTime.is_timepoint?(stop_time_with_timepoint)
      refute StopTime.is_timepoint?(stop_time_without_timepoint)
    end
  end
end
