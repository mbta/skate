defmodule SkateWeb.RouteTabsController do
  use SkateWeb, :controller

  alias SkateWeb.AuthManager
  alias Skate.Settings.RouteTab

  def update(conn, %{"route_tabs" => route_tabs} = _params) do
    username = AuthManager.Plug.current_resource(conn)

    new_route_tabs = RouteTab.update_all_for_user!(username, format_tabs_for_update(route_tabs))
    json(conn, %{data: new_route_tabs})
  end

  @spec format_tabs_for_update([map()]) :: [RouteTab.t()]
  defp format_tabs_for_update(route_tabs) do
    Enum.map(route_tabs, fn route_tab ->
      %RouteTab{
        uuid: Map.get(route_tab, "uuid"),
        preset_name: Map.get(route_tab, "presetName"),
        selected_route_ids: Map.get(route_tab, "selectedRouteIds", []),
        ladder_directions: Map.get(route_tab, "ladderDirections", %{}),
        ladder_crowding_toggles: Map.get(route_tab, "ladderCrowdingToggles", %{}),
        ordering: Map.get(route_tab, "ordering"),
        is_current_tab: Map.get(route_tab, "isCurrentTab")
      }
    end)
  end
end
