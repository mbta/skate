defmodule SkateWeb.RouteTabsControllerTest do
  use SkateWeb.ConnCase
  use Skate.DataCase

  alias Skate.Settings.RouteTab

  describe "PUT /api/route_tabs" do
    @tag :authenticated
    test "doesn't set route tabs for logged-in user (for now)", %{conn: conn, user: user} do
      conn =
        put(conn, "/api/route_tabs", %{
          "route_tabs" => [
            %{
              "presetName" => "new preset",
              "selectedRouteIds" => ["1", "28"],
              "ordering" => "12345"
            }
          ]
        })

      response(conn, 200)

      assert [] = RouteTab.get_all_for_user(user)
    end
  end
end
