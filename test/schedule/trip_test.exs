defmodule Schedule.TripTest do
  use ExUnit.Case, async: true

  alias Schedule.Trip
  alias Schedule.Gtfs.StopTime
  alias Schedule.Gtfs
  alias Schedule.Hastus

  @gtfs_trip %Gtfs.Trip{
    id: "trip",
    route_id: "route",
    service_id: "service",
    headsign: "headsign",
    direction_id: 0,
    block_id: "block",
    shape_id: "shape"
  }

  @hastus_trip %Hastus.Trip{
    schedule_id: "schedule",
    run_id: "run",
    block_id: "block",
    start_time: 0,
    end_time: 0,
    start_place: "start",
    end_place: "end",
    # nil means nonrevenue
    route_id: "route",
    trip_id: "trip"
  }

  @stop_times [
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
  @trip %Trip{
    id: "trip",
    route_id: "route",
    block_id: "block",
    service_id: "service",
    headsign: "headsign",
    direction_id: 0,
    shape_id: "shape",
    schedule_id: "schedule",
    run_id: "run",
    stop_times: @stop_times
  }

  describe "merge_trips" do
    test "matches up gtfs and hastus trips" do
      assert Trip.merge_trips([@gtfs_trip], [@hastus_trip], %{"trip" => @stop_times}) == %{
               "trip" => @trip
             }
    end

    test "makes a gtfs trip without a hastus trip" do
      assert Trip.merge_trips([@gtfs_trip], [], %{"trip" => @stop_times}) == %{
               "trip" => %Trip{
                 id: "trip",
                 route_id: "route",
                 block_id: "block",
                 service_id: "service",
                 headsign: "headsign",
                 direction_id: 0,
                 shape_id: "shape",
                 schedule_id: nil,
                 run_id: nil,
                 stop_times: @stop_times
               }
             }
    end

    test "makes a hastus trip without a gtfs trip" do
      assert Trip.merge_trips([], [@hastus_trip], %{}) == %{
               "trip" => %Trip{
                 id: "trip",
                 route_id: "route",
                 block_id: "block",
                 service_id: nil,
                 headsign: nil,
                 direction_id: nil,
                 shape_id: nil,
                 schedule_id: "schedule",
                 run_id: "run",
                 stop_times: []
               }
             }
    end
  end

  describe "merge" do
    test "combines gtfs trip, hastus_trip, and stop_times" do
      assert Trip.merge(@gtfs_trip, @hastus_trip, @stop_times) == @trip
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

  describe "id_sans_overload/1" do
    test "removes the overload portion of the ID" do
      assert Trip.id_sans_overload("44169914-OL1") == "44169914"
    end

    test "does not change an ID without an overload" do
      assert Trip.id_sans_overload("44169914") == "44169914"
    end

    test "returns nil when given nil" do
      assert Trip.id_sans_overload(nil) == nil
    end
  end
end
