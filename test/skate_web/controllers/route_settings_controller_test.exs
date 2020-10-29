defmodule SkateWeb.RouteSettingsControllerTest do
  use SkateWeb.ConnCase
  use Skate.DataCase

  alias Skate.Settings.RouteSettings
  alias SkateWeb.AuthManager

  @username "FAKE_UID"

  defp login(conn) do
    {:ok, token, _} = AuthManager.encode_and_sign(@username)
    put_req_header(conn, "authorization", "bearer: " <> token)
  end

  describe "PUT /api/route_settings" do
    test "can set route settings for logged-in user", %{conn: conn} do
      RouteSettings.get_or_create(@username)

      conn =
        conn
        |> login()
        |> put("/api/route_settings", %{
          "selectedRouteIds" => ["39"],
          "ladderDirections" => %{"39" => 1, "77" => 0},
          "ladderCrowdingToggles" => %{"66" => true}
        })

      response(conn, 200)
      result = RouteSettings.get_or_create(@username)

      assert result == %Skate.Settings.RouteSettings{
               ladder_crowding_toggles: %{"66" => true},
               ladder_directions: %{"39" => 1, "77" => 0},
               selected_route_ids: ["39"]
             }
    end
  end
end
