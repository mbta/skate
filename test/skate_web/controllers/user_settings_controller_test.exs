defmodule SkateWeb.UserSettingsControllerTest do
  use SkateWeb.ConnCase
  use Skate.DataCase

  alias Skate.Settings.UserSettings
  alias SkateWeb.AuthManager

  @username "FAKE_UID"

  describe "PUT /api/user_settings" do
    setup do
      UserSettings.get_or_create(@username)
      :ok
    end

    test "can set ladder_page_vehicle_label", %{conn: conn} do
      conn =
        conn
        |> login()
        |> put("/api/user_settings", %{
          "field" => "ladder_page_vehicle_label",
          "value" => "vehicle_id"
        })

      response(conn, 200)
      result = UserSettings.get_or_create(@username)
      assert result.ladder_page_vehicle_label == :vehicle_id
    end

    test "can set shuttle_page_vehicle_label", %{conn: conn} do
      conn =
        conn
        |> login()
        |> put("/api/user_settings", %{
          "field" => "shuttle_page_vehicle_label",
          "value" => "run_id"
        })

      response(conn, 200)
      result = UserSettings.get_or_create(@username)
      assert result.shuttle_page_vehicle_label == :run_id
    end

    test "gives 400 for invalid field", %{conn: conn} do
      conn =
        conn
        |> login()
        |> put("/api/user_settings", %{
          "field" => "invalid_field",
          "value" => "run_id"
        })

      response(conn, 400)
    end

    test "gives 400 for invalid value", %{conn: conn} do
      conn =
        conn
        |> login()
        |> put("/api/user_settings", %{
          "field" => "ladder_page_vehicle_label",
          "value" => "invalid_value"
        })

      response(conn, 400)
    end
  end

  defp login(conn) do
    {:ok, token, _} = AuthManager.encode_and_sign(@username)
    put_req_header(conn, "authorization", "bearer: " <> token)
  end
end
