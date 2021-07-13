defmodule Skate.Factory do
  use ExMachina.Ecto, repo: Skate.Repo

  def vehicle_factory do
    %Realtime.Vehicle{
      id: "on_route",
      label: "on_route",
      timestamp: 0,
      timestamp_by_source: %{"swiftly" => 0},
      latitude: 0,
      longitude: 0,
      direction_id: 1,
      route_id: "route",
      trip_id: "trip",
      bearing: 0,
      block_id: "block",
      operator_id: "",
      operator_first_name: "",
      operator_last_name: "",
      operator_name: "",
      operator_logon_time: nil,
      run_id: "",
      headway_spacing: :ok,
      is_shuttle: false,
      is_overload: false,
      is_off_course: false,
      is_revenue: true,
      layover_departure_time: nil,
      block_is_active: true,
      sources: "",
      stop_status: "",
      route_status: :on_route,
      end_of_trip_type: :another_trip
    }
  end

  def ghost_factory do
    %Realtime.Ghost{
      id: "ghost-trip",
      direction_id: 0,
      route_id: "1",
      trip_id: "t2",
      headsign: "headsign",
      block_id: "block",
      run_id: "123-9049",
      via_variant: "X",
      layover_departure_time: nil,
      scheduled_timepoint_status: %{
        timepoint_id: "t2",
        fraction_until_timepoint: 0.5
      },
      route_status: :on_route
    }
  end

  def minischedule_trip_factory do
    %Schedule.Minischedule.Trip{
      id: "trip",
      block_id: "block"
    }
  end

  def minischedule_piece_factory do
    %Schedule.Minischedule.Piece{
      schedule_id: "schedule",
      run_id: "run",
      start_time: 50,
      start_place: "garage",
      trips: [
        build(:minischedule_trip),
        build(:minischedule_trip, %{id: "trip2", route_id: "route"})
      ],
      end_time: 200,
      end_place: "station"
    }
  end

  def minischedule_block_factory do
    %Schedule.Minischedule.Block{
      schedule_id: "schedule",
      id: "block",
      pieces: [
        build(:minischedule_piece)
      ]
    }
  end

  def minischedule_run_factory do
    %Schedule.Minischedule.Run{
      schedule_id: "schedule",
      service_id: "service",
      id: "run",
      activities: [
        build(:minischedule_piece)
      ]
    }
  end

  def gtfs_stoptime_factory do
    %Schedule.Gtfs.StopTime{
      stop_id: "stop1",
      time: 150,
      timepoint_id: "t1"
    }
  end

  def schedule_trip_factory do
    %Schedule.Trip{
      id: "trip",
      block_id: "block",
      route_id: "route",
      service_id: "service",
      headsign: "headsign",
      direction_id: 0,
      run_id: "run",
      stop_times: [
        build(:gtfs_stoptime)
      ],
      start_time: 100,
      end_time: 200
    }
  end

  def hastus_trip_factory do
    %Schedule.Hastus.Trip{
      schedule_id: "schedule",
      run_id: "run",
      block_id: "block",
      start_time: 100,
      end_time: 102,
      start_place: "place1",
      end_place: "place2",
      route_id: "route",
      trip_id: "trip1"
    }
  end

  def hastus_activity_factory do
    %Schedule.Hastus.Activity{
      schedule_id: "schedule",
      run_id: "run",
      start_time: 100,
      end_time: 105,
      start_place: "place1",
      end_place: "place2",
      activity_type: "Operator",
      partial_block_id: "lock"
    }
  end
end
