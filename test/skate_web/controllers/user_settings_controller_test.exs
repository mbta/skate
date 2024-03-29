defmodule SkateWeb.UserSettingsControllerTest do
  use SkateWeb.ConnCase

  alias Skate.Settings.UserSettings

  describe "PUT /api/user_settings" do
    setup %{user: user} do
      UserSettings.get_or_create(user.id)
      :ok
    end

    @tag :authenticated
    test "can set ladder_page_vehicle_label", %{conn: conn, user: user} do
      conn =
        put(conn, "/api/user_settings", %{
          "field" => "ladder_page_vehicle_label",
          "value" => "vehicle_id"
        })

      response(conn, 200)
      result = UserSettings.get_or_create(user.id)
      assert result.ladder_page_vehicle_label == :vehicle_id
    end

    @tag :authenticated
    test "can set shuttle_page_vehicle_label", %{conn: conn, user: user} do
      conn =
        put(conn, "/api/user_settings", %{
          "field" => "shuttle_page_vehicle_label",
          "value" => "run_id"
        })

      response(conn, 200)
      result = UserSettings.get_or_create(user.id)
      assert result.shuttle_page_vehicle_label == :run_id
    end

    @tag :authenticated
    test "can set vehicle_adherence_colors", %{conn: conn, user: user} do
      conn =
        put(conn, "/api/user_settings", %{
          "field" => "vehicle_adherence_colors",
          "value" => "early_blue"
        })

      response(conn, 200)
      result = UserSettings.get_or_create(user.id)
      assert result.vehicle_adherence_colors == :early_blue
    end

    @tag :authenticated
    test "gives 400 for invalid field", %{conn: conn} do
      conn =
        put(conn, "/api/user_settings", %{
          "field" => "invalid_field",
          "value" => "run_id"
        })

      response(conn, 400)
    end

    @tag :authenticated
    test "gives 400 for invalid value", %{conn: conn} do
      conn =
        put(conn, "/api/user_settings", %{
          "field" => "ladder_page_vehicle_label",
          "value" => "invalid_value"
        })

      response(conn, 400)
    end
  end
end
