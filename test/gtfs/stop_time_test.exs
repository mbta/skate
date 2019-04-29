defmodule Gtfs.StopTimeTest do
  use ExUnit.Case, async: true

  alias Gtfs.StopTime

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

  describe "trip_timepoints_from_csv/1" do
    test "builds a StopTime struct from a list of stop time csv rows" do
      assert %{
               "39770780" => ["dudly", "melwa"],
               "39770783" => ["bbsta", "", "hunbv"]
             } = StopTime.trip_timepoints_from_csv(@csv_rows)
    end
  end

  describe "row_includes_a_checkpoint?/1" do
    test "returns whether the row includes a value in the checkpoint column" do
      assert StopTime.row_includes_a_checkpoint?(Enum.at(@csv_rows, 4))
      refute StopTime.row_includes_a_checkpoint?(Enum.at(@csv_rows, 3))
    end
  end

  describe "row_in_trip_id_set?/2" do
    test "returns whether the row's trip id is in the given set" do
      assert StopTime.row_in_trip_id_set?(
               List.first(@csv_rows),
               MapSet.new(["39770779", "39770780"])
             )

      refute StopTime.row_in_trip_id_set?(List.first(@csv_rows), MapSet.new(["1", "2"]))
    end
  end
end
