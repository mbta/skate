defmodule SkateWeb.UserSettingsControllerTest do
  use SkateWeb.ConnCase

  alias Skate.Settings.UserSettings

  describe "PUT /api/user_settings" do
    setup %{user: username} do
      UserSettings.get_or_create(username)
      :ok
    end

    @tag :authenticated
    test "can set ladder_page_vehicle_label", %{conn: conn, user: username} do
      conn =
        conn
        |> put("/api/user_settings", %{
          "field" => "ladder_page_vehicle_label",
          "value" => "vehicle_id"
        })

      response(conn, 200)
      result = UserSettings.get_or_create(username)
      assert result.ladder_page_vehicle_label == :vehicle_id
    end

    @tag :authenticated
    test "can set shuttle_page_vehicle_label", %{conn: conn, user: username} do
      conn =
        conn
        |> put("/api/user_settings", %{
          "field" => "shuttle_page_vehicle_label",
          "value" => "run_id"
        })

      response(conn, 200)
      result = UserSettings.get_or_create(username)
      assert result.shuttle_page_vehicle_label == :run_id
    end

    @tag :authenticated
    test "can set vehicle_adherence_colors", %{conn: conn, user: username} do
      conn =
        conn
        |> put("/api/user_settings", %{
          "field" => "vehicle_adherence_colors",
          "value" => "early_blue"
        })

      response(conn, 200)
      result = UserSettings.get_or_create(username)
      assert result.vehicle_adherence_colors == :early_blue
    end

    @tag :authenticated
    test "gives 400 for invalid field", %{conn: conn} do
      conn =
        conn
        |> put("/api/user_settings", %{
          "field" => "invalid_field",
          "value" => "run_id"
        })

      response(conn, 400)
    end

    @tag :authenticated
    test "gives 400 for invalid value", %{conn: conn} do
      conn =
        conn
        |> put("/api/user_settings", %{
          "field" => "ladder_page_vehicle_label",
          "value" => "invalid_value"
        })

      response(conn, 400)
    end
  end
end
