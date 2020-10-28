defmodule SkateWeb.RouteSettingsController do
  use SkateWeb, :controller

  alias SkateWeb.AuthManager
  alias Skate.Settings.RouteSettings

  def update(conn, _params) do
    username = AuthManager.Plug.current_resource(conn)

    settings = conn.body_params
    RouteSettings.set(username, format_settings_for_set(settings))
    send_resp(conn, 200, "")
  end

  defp format_settings_for_set(%{
         "ladderCrowdingToggles" => ladder_crowding_toggles,
         "ladderDirections" => ladder_directions,
         "selectedRouteIds" => selected_route_ids
       }) do
    [
      {:ladder_crowding_toggles, ladder_crowding_toggles},
      {:ladder_directions, ladder_directions},
      {:selected_route_ids, selected_route_ids}
    ]
  end
end
