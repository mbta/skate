defmodule SkateWeb.RouteTabsController do
  use SkateWeb, :controller

  alias SkateWeb.AuthManager
  alias Skate.Settings.RouteTab

  def update(conn, %{"route_tabs" => route_tabs} = _params) do
    username = AuthManager.Plug.current_resource(conn)

    RouteTab.update_all_for_user!(username, format_tabs_for_update(route_tabs))
    send_resp(conn, 200, "")
  end

  @spec format_tabs_for_update([map()]) :: [RouteTab.t()]
  defp format_tabs_for_update(route_tabs) do
    Enum.map(route_tabs, fn route_tab ->
      %RouteTab{
        id: Map.get(route_tab, "id"),
        preset_name: Map.get(route_tab, "presetName"),
        selected_route_ids: Map.get(route_tab, "selectedRouteIds", []),
        ladder_directions: Map.get(route_tab, "ladderDirections", %{}),
        ladder_crowding_toggles: Map.get(route_tab, "ladderCrowdingToggles", %{}),
        ordering: Map.get(route_tab, "ordering")
      }
    end)
  end
end
