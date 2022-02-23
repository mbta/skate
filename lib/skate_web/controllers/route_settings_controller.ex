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

  defp format_settings_for_set(settings) do
    translations = %{
      "ladderCrowdingToggles" => :ladder_crowding_toggles,
      "ladderDirections" => :ladder_directions,
      "selectedRouteIds" => :selected_route_ids
    }

    settings
    |> Map.take(Map.keys(translations))
    |> Map.new(fn {key, value} -> {Map.fetch!(translations, key), value} end)
  end
end
