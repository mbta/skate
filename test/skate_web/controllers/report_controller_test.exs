defmodule SkateWeb.ReportControllerTest do
  use SkateWeb.ConnCase
  use Skate.DataCase
  alias SkateWeb.AuthManager

  alias Skate.Settings.Db.User, as: DbUser
  alias Skate.Settings.Db.UserSettings, as: DbUserSettings

  describe "index/2" do
    test "returns page with reports listed", %{conn: conn} do
      {:ok, token, _} = AuthManager.encode_and_sign("FAKE_UID")

      conn =
        conn
        |> put_req_header("authorization", "bearer: " <> token)
        |> get(SkateWeb.Router.Helpers.report_path(conn, :index))

      assert html_response(conn, 200) =~ "User settings"
    end
  end

  describe "run/2" do
    test "successfully runs a report", %{conn: conn} do
      username = "username"

      user =
        Skate.Repo.insert!(
          DbUser.changeset(%DbUser{}, %{username: username}),
          returning: true
        )

      Skate.Repo.insert!(
        DbUserSettings.changeset(%DbUserSettings{}, %{
          user_id: user.id,
          ladder_page_vehicle_label: :vehicle_id,
          shuttle_page_vehicle_label: :run_id,
          vehicle_adherence_colors: :early_blue,
          minischedules_trip_label: :origin
        }),
        returning: true
      )

      {:ok, token, _} = AuthManager.encode_and_sign("FAKE_UID")

      response =
        conn
        |> put_req_header("authorization", "bearer: " <> token)
        |> get(SkateWeb.Router.Helpers.report_path(conn, :run, "user_settings"))
        |> response(200)

      assert response =~ "ladder_page_vehicle_label"
      assert response =~ "shuttle_page_vehicle_label"
      assert response =~ "vehicle_adherence_colors"
    end

    test "returns 404 for invalid report", %{conn: conn} do
      {:ok, token, _} = AuthManager.encode_and_sign("FAKE_UID")

      conn =
        conn
        |> put_req_header("authorization", "bearer: " <> token)
        |> get(SkateWeb.Router.Helpers.report_path(conn, :run, "not_a_report"))

      assert response(conn, 404) == "no report found"
    end
  end
end
