defmodule SkateWeb.RouteSettingsControllerTest do
  use SkateWeb.ConnCase
  use Skate.DataCase

  alias Skate.Settings.RouteSettings

  describe "PUT /api/route_settings" do
    @tag :authenticated
    test "can set route settings for logged-in user", %{conn: conn, user: username} do
      RouteSettings.get_or_create(username)

      conn =
        conn
        |> put("/api/route_settings", %{
          "selectedRouteIds" => ["39"],
          "ladderDirections" => %{"39" => 1, "77" => 0},
          "ladderCrowdingToggles" => %{"66" => true}
        })

      response(conn, 200)
      result = RouteSettings.get_or_create(username)

      assert result == %Skate.Settings.RouteSettings{
               ladder_crowding_toggles: %{"66" => true},
               ladder_directions: %{"39" => 1, "77" => 0},
               selected_route_ids: ["39"]
             }
    end

    @tag :authenticated
    test "tolerates missing values", %{conn: conn, user: username} do
      RouteSettings.get_or_create(username)

      conn =
        conn
        |> put("/api/route_settings", %{
          "selectedRouteIds" => ["39"]
        })

      response(conn, 200)
      result = RouteSettings.get_or_create(username)

      assert result == %Skate.Settings.RouteSettings{
               ladder_directions: %{},
               ladder_crowding_toggles: %{},
               selected_route_ids: ["39"]
             }

      conn =
        conn
        |> put("/api/route_settings", %{
          "ladderDirections" => %{"39" => "1"}
        })

      response(conn, 200)
      result = RouteSettings.get_or_create(username)

      assert result == %Skate.Settings.RouteSettings{
               ladder_directions: %{"39" => "1"},
               ladder_crowding_toggles: %{},
               selected_route_ids: ["39"]
             }

      conn =
        conn
        |> put("/api/route_settings", %{
          "ladderCrowdingToggles" => %{"39" => "true"}
        })

      response(conn, 200)
      result = RouteSettings.get_or_create(username)

      assert result == %Skate.Settings.RouteSettings{
               ladder_directions: %{"39" => "1"},
               ladder_crowding_toggles: %{"39" => "true"},
               selected_route_ids: ["39"]
             }
    end
  end
end
