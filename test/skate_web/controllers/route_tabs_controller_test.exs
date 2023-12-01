defmodule SkateWeb.RouteTabsControllerTest do
  use SkateWeb.ConnCase

  alias Skate.Settings.RouteTab

  describe "PUT /api/route_tabs" do
    @tag :authenticated
    test "sets route tabs for logged-in user", %{conn: conn, user: user} do
      conn =
        put(conn, "/api/route_tabs", %{
          "route_tabs" => [
            %{
              "uuid" => Ecto.UUID.generate(),
              "presetName" => "new preset",
              "selectedRouteIds" => ["1", "28"],
              "ordering" => "12345"
            }
          ]
        })

      response(conn, 200)

      assert [
               %RouteTab{
                 preset_name: "new preset",
                 selected_route_ids: ["1", "28"],
                 ordering: 12_345
               }
             ] = RouteTab.get_all_for_user(user.id)
    end
  end
end
