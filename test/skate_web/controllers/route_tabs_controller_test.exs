defmodule SkateWeb.RouteTabsControllerTest do
  use SkateWeb.ConnCase
  use Skate.DataCase

  alias Skate.Settings.RouteTab

  describe "PUT /api/route_tabs" do
    @tag :authenticated
    test "sets route tabs for logged-in user", %{conn: conn, user: user} do
      conn =
        put(conn, "/api/route_tabs", %{
          "route_tabs" => [%{"presetName" => "new preset", "selectedRouteIds" => ["1", "28"]}]
        })

      response(conn, 200)

      assert [%RouteTab{preset_name: "new preset", selected_route_ids: ["1", "28"]}] =
               RouteTab.get_all_for_user(user)
    end
  end
end
