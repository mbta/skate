defmodule SkateWeb.RouteTabsController do
  use SkateWeb, :controller

  alias SkateWeb.AuthManager
  alias Skate.Settings.RouteTab

  def update(conn, %{"route_tabs" => route_tabs} = _params) do
    %{user_id: user_id} = AuthManager.Plug.current_resource(conn)

    new_route_tabs = RouteTab.update_all_for_user!(user_id, format_tabs_for_update(route_tabs))
    json(conn, %{data: new_route_tabs})
  end

  @spec format_tabs_for_update([map()]) :: [RouteTab.t()]
  defp format_tabs_for_update(route_tabs) do
    Enum.map(route_tabs, &format_tab/1)
  end

  @spec format_tab(map()) :: RouteTab.t()
  defp format_tab(route_tab) do
    %RouteTab{
      uuid: Map.get(route_tab, "uuid"),
      preset_name: Map.get(route_tab, "presetName"),
      selected_route_ids: Map.get(route_tab, "selectedRouteIds", []),
      ladder_directions: Map.get(route_tab, "ladderDirections", %{}),
      ladder_crowding_toggles: Map.get(route_tab, "ladderCrowdingToggles", %{}),
      ordering: Map.get(route_tab, "ordering"),
      is_current_tab: Map.get(route_tab, "isCurrentTab"),
      save_changes_to_tab_uuid: Map.get(route_tab, "saveChangesToTabUuid")
    }
  end
end
