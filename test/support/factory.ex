defmodule Skate.Factory do
  @moduledoc false

  use ExMachina.Ecto, repo: Skate.Repo
  use Skate.DetourFactory
  use Skate.OpenRouteServiceFactory
  use Skate.GtfsFactory
  use Skate.ScheduleFactory
  use Skate.HastusFactory

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
      email: sequence(:user_email, &"test-#{&1}@mbta.com"),
      username: sequence("Skate.Settings.Db.User.username:")
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
