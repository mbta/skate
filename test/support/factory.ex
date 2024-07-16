defmodule Skate.Factory do
  @moduledoc false

  use ExMachina.Ecto, repo: Skate.Repo

  def operator_id_factory(_) do
    sequence(:operator_id, &to_string/1, start_at: 10_000)
  end

  def first_name_factory(_) do
    sequence(:first_name, &"First(#{&1})")
  end

  def last_name_factory(_) do
    sequence(:first_name, &"Last(#{&1})")
  end

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

  def gtfs_realtime_enhanced_trip_descriptor_factory do
    %{
      "direction_id" => 0,
      "overload_offset" => -6,
      "route_id" => "Green-E",
      "schedule_relationship" => "SCHEDULED",
      "start_date" => "20180815",
      "start_time" => nil,
      "tm_trip_id" => "37165437-X"
    }
  end

  def gtfs_realtime_enhanced_vehicle_position_factory do
    %{
      "block_id" => "Q238-135",
      "capacity" => 18,
      "congestion_level" => nil,
      "current_status" => "STOPPED_AT",
      "current_stop_sequence" => 670,
      "load" => 12,
      "location_source" => "samsara",
      "occupancy_percentage" => 0.67,
      "occupancy_status" => "FEW_SEATS_AVAILABLE",
      "operator" => %{
        "id" => build(:operator_id),
        "logon_time" => 1_534_340_301,
        "first_name" => build(:first_name),
        "last_name" => "EVANS"
      },
      "position" => %{
        "bearing" => 135,
        "latitude" => 42.32951,
        "longitude" => -71.11109,
        "odometer" => 5.1,
        "speed" => 2.9796
      },
      "run_id" => "128-1007",
      "stop_id" => "70257",
      "timestamp" => 1_534_340_406,
      "trip" => build(:gtfs_realtime_enhanced_trip_descriptor),
      "vehicle" => %{
        "id" => "G-10098",
        "label" => "3823-3605",
        "license_plate" => nil
      },
      "revenue" => false
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
    stop_id = sequence("Schedule.Gtfs.Stop.id:")

    %Schedule.Gtfs.Stop{
      id: stop_id,
      name: "Stop #{stop_id}",
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

  def gtfs_route_pattern_factory do
    route_pattern_id = sequence("Schedule.Gtfs.RoutePattern.id:")

    %Schedule.Gtfs.RoutePattern{
      id: route_pattern_id,
      name: "",
      route_id: "route",
      direction_id: 0,
      representative_trip_id: "#{route_pattern_id}_representative_trip_id",
      time_desc: nil,
      sort_order: 1
    }
  end

  def gtfs_shape_point_factory do
    %Schedule.Gtfs.Shape.Point{
      shape_id: "shape1",
      lat: 42.413560 + sequence(:shape_point_seq, &(&1 * 0.001)),
      lon: -70.992110 + sequence(:shape_point_seq, &(&1 * 0.001)),
      sequence: sequence(:shape_point_seq, & &1)
    }
  end

  def gtfs_shape_factory(attrs) do
    shape_id = Map.get(attrs, :id, "shape1")

    shape = %Schedule.Gtfs.Shape{
      id: shape_id,
      points: build_list(10, :gtfs_shape_point, %{shape_id: shape_id})
    }

    merge_attributes(shape, attrs)
  end

  def shape_with_stops_factory(attrs) do
    shape = build(:gtfs_shape, Map.take(attrs, [:id, :points]))

    shape_with_stops = %Schedule.ShapeWithStops{
      id: shape.id,
      points: shape.points,
      stops: build_list(3, :gtfs_stop)
    }

    merge_attributes(shape_with_stops, attrs)
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

  def amazon_location_place_factory(attrs) do
    address_number = Map.get(attrs, :address_number, sequence(:address_number, &to_string/1))
    street = Map.get(attrs, :street, "Test St")
    name = Map.get(attrs, :name, "Landmark")
    address_suffix = Map.get(attrs, :address_suffix, "MA 02201, United States")

    %{
      "AddressNumber" => address_number,
      "Geometry" => %{
        "Point" => [0, 0]
      },
      "Label" =>
        "#{name && name <> ", "}#{address_number && address_number <> " "}#{street && street <> ", "}#{address_suffix}",
      "Street" => street
    }
  end

  def amazon_location_search_result_factory(attrs) do
    result = %{
      "Place" => fn -> build(:amazon_location_place, attrs) end,
      "PlaceId" => "test_id_#{sequence(:place_id, &to_string/1)}"
    }

    result |> merge_attributes(attrs) |> evaluate_lazy_attributes()
  end

  def amazon_location_suggest_result_factory do
    %{
      "Text" =>
        "#{sequence(:address_number, &to_string/1)} Test St, Boston, MA 02201, United States",
      "PlaceId" => "test_id_#{sequence(:place_id, &to_string/1)}"
    }
  end

  def db_notification_factory() do
    %Notifications.Db.Notification{
      created_at: DateTime.to_unix(DateTime.utc_now())
    }
  end

  def user_factory do
    %Skate.Settings.Db.User{
      uuid: Ecto.UUID.generate(),
      email: sequence("test@mbta.com"),
      username: sequence("test_user")
    }
  end

  def ors_directions_step_json_factory do
    %{
      "instruction" => sequence("ors_instruction_step"),
      "name" => sequence("ors_instruction_name"),
      "type" => sequence("ors_instruction_type", [0, 1, 2, 3, 4, 5, 6, 7, 12, 13])
    }
  end

  def ors_directions_segment_json_factory do
    %{
      "steps" =>
        build_list(
          sequence("ors_segment_json_num_steps", [4, 1, 3, 2]),
          :ors_directions_step_json
        )
    }
  end

  def ors_directions_json_factory(attrs) do
    coordinates = Map.get(attrs, :coordinates, [[0, 0], [1, 1], [2, 2]])

    segments =
      Map.get_lazy(attrs, :segments, fn ->
        build_list(3, :ors_directions_segment_json)
      end)

    %{
      "features" => [
        %{
          "geometry" => %{"coordinates" => coordinates},
          "properties" => %{
            "segments" => segments
          }
        }
      ]
    }
  end

  def ueberauth_auth_factory do
    %Ueberauth.Auth{
      provider: :keycloak,
      uid: "test_username",
      credentials: %Ueberauth.Auth.Credentials{
        expires_at: System.system_time(:second) + 1_000,
        refresh_token: "test_refresh_token"
      },
      info: %{email: "test@mbta.com"},
      extra: %Ueberauth.Auth.Extra{
        raw_info: %UeberauthOidcc.RawInfo{
          userinfo: %{
            "resource_access" => %{
              "test-client" => %{"roles" => ["test1", "skate-readonly"]}
            }
          }
        }
      }
    }
  end
end
