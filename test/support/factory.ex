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
end
