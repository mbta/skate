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
      overload_offset: nil,
      run_id: "",
      incoming_trip_direction_id: nil,
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
      incoming_trip_direction_id: nil,
      layover_departure_time: nil,
      scheduled_timepoint_status: %{
        timepoint_id: "t2",
        fraction_until_timepoint: 0.5
      },
      route_status: :on_route
    }
  end

  def piece_factory do
    %Schedule.Piece{
      schedule_id: "schedule",
      run_id: "run",
      start_time: 50,
      start_place: "garage",
      trips: [
        build(:trip),
        build(:trip, %{id: "trip2", route_id: "route"})
      ],
      end_time: 200,
      end_place: "station"
    }
  end

  def block_factory do
    %Schedule.Block{
      id: "block",
      service_id: "service",
      schedule_id: "schedule",
      start_time: 0,
      end_time: 1,
      pieces: [build(:piece)]
    }
  end

  def run_factory do
    %Schedule.Run{
      schedule_id: "schedule",
      service_id: "service",
      id: "run",
      activities: [
        build(:piece)
      ]
    }
  end

  def as_directed_factory do
    %Schedule.AsDirected{
      kind: :wad,
      start_time: 1,
      end_time: 2,
      start_place: "place1",
      end_place: "place2"
    }
  end

  def gtfs_stoptime_factory do
    %Schedule.Gtfs.StopTime{
      stop_id: "stop1",
      time: 150,
      timepoint_id: "t1"
    }
  end

  def gtfs_stop_factory do
    %Schedule.Gtfs.Stop{
      id: "stop1",
      name: "Stop 1",
      location_type: :stop,
      latitude: 42.01,
      longitude: -71.01
    }
  end

  def gtfs_route_factory do
    %Schedule.Gtfs.Route{
      id: "route",
      description: "Key Bus",
      direction_names: %{0 => "Outbound", 1 => "Inbound"},
      name: "Point A - Point B",
      garages: MapSet.new([])
    }
  end

  def trip_factory do
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
      partial_block_id: "block"
    }
  end

  def route_tab_factory do
    %Skate.Settings.RouteTab{
      uuid: Ecto.UUID.generate(),
      preset_name: "preset",
      selected_route_ids: [],
      ladder_directions: %{},
      ladder_crowding_toggles: %{},
      ordering: sequence(""),
      is_current_tab: false,
      save_changes_to_tab_uuid: nil
    }
  end

  def user_factory do
    %Skate.Settings.Db.User{
      uuid: Ecto.UUID.generate(),
      email: sequence("test@mbta.com"),
      username: sequence("test_user")
    }
  end
end
