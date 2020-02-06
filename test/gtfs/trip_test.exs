defmodule Gtfs.TripTest do
  use ExUnit.Case, async: true

  alias Gtfs.{StopTime, Trip}

  @trip %Trip{
    id: "trip",
    route_id: "route",
    service_id: "service",
    headsign: "headsign",
    direction_id: 0,
    block_id: "block",
    shape_id: "shape",
    stop_times: [
      %StopTime{
        stop_id: "stop1",
        time: 3
      },
      %StopTime{
        stop_id: "stop2",
        time: 6
      },
      %StopTime{
        stop_id: "stop3",
        time: 9
      }
    ]
  }

  describe "from_csv_row" do
    test "builds a Trip struct from a csv row" do
      csv_row = %{
        "route_id" => "1",
        "service_id" => "BUS22019-hbc29011-Weekday-02",
        "trip_id" => "39914057",
        "trip_headsign" => "Harvard",
        "trip_short_name" => "",
        "direction_id" => "0",
        "block_id" => "C01-20",
        "shape_id" => "010070",
        "wheelchair_accessible" => "1",
        "trip_route_type" => "",
        "route_pattern_id" => "1-_-0",
        "bikes_allowed" => "1"
      }

      assert Trip.from_csv_row(csv_row) == %Trip{
               id: "39914057",
               route_id: "1",
               service_id: "BUS22019-hbc29011-Weekday-02",
               headsign: "Harvard",
               direction_id: 0,
               block_id: "C01-20",
               route_pattern_id: "1-_-0",
               shape_id: "010070"
             }
    end

    test "missing route_pattern_id is read as nil" do
      csv_row = %{
        "route_id" => "1",
        "service_id" => "BUS22019-hbc29011-Weekday-02",
        "trip_id" => "39914057",
        "trip_headsign" => "Harvard",
        "trip_short_name" => "",
        "direction_id" => "0",
        "block_id" => "C01-20",
        "shape_id" => "010070",
        "wheelchair_accessible" => "1",
        "trip_route_type" => "",
        "route_pattern_id" => "",
        "bikes_allowed" => "1"
      }

      assert %Trip{route_pattern_id: nil} = Trip.from_csv_row(csv_row)
    end
  end

  describe "start_time/1" do
    test "returns the time of the trip's first stop" do
      assert Trip.start_time(@trip) == 3
    end
  end

  describe "end_time/1" do
    test "returns the time of the trip's last stop" do
      assert Trip.end_time(@trip) == 9
    end
  end

  describe "time_of_first_stop_matching/2" do
    test "returns the time of the first stop in the list" do
      stop_ids = ["stop3", "stop2"]

      assert Trip.time_of_first_stop_matching(@trip, stop_ids) == 6
    end
  end

  describe "time_of_last_stop_matching/2" do
    test "returns the time of the first stop in the list" do
      stop_ids = ["stop1", "stop2"]

      assert Trip.time_of_last_stop_matching(@trip, stop_ids) == 6
    end
  end

  describe "is_active" do
    test "a trip that starts before the range and ends after is active" do
      assert Trip.is_active(@trip, 4, 5)
    end

    test "a trip that starts before the range and ends during is active" do
      assert Trip.is_active(@trip, 5, 7)
    end

    test "a trip that starts during the range and ends after is active" do
      assert Trip.is_active(@trip, 2, 4)
    end

    test "a trip that's totally inside the time range is active" do
      assert Trip.is_active(@trip, 2, 7)
    end

    test "a trip is active if the start and end times are the same" do
      assert Trip.is_active(@trip, 4, 4)
    end

    test "a trip totally before the range is inactive" do
      refute Trip.is_active(@trip, 10, 12)
    end

    test "a trip totally after the range is inactive" do
      refute Trip.is_active(@trip, 1, 2)
    end
  end
end
