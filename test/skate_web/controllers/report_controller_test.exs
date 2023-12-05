defmodule SkateWeb.ReportControllerTest do
  use SkateWeb.ConnCase

  import Skate.Factory

  alias Skate.Settings.Db.UserSettings, as: DbUserSettings

  describe "index/2" do
    @tag :authenticated
    test "when not an admin, redirects to unauthorized page", %{conn: conn} do
      conn = get(conn, SkateWeb.Router.Helpers.report_path(conn, :index))

      assert redirected_to(conn) == SkateWeb.Router.Helpers.unauthorized_path(conn, :index)
    end

    @tag :authenticated_admin
    test "returns page with reports listed", %{conn: conn} do
      conn = get(conn, SkateWeb.Router.Helpers.report_path(conn, :index))

      assert html_response(conn, 200) =~ "User settings"
    end
  end

  describe "run/2" do
    @tag :authenticated
    test "when not an admin, redirects to unauthorized page", %{conn: conn} do
      conn = get(conn, SkateWeb.Router.Helpers.report_path(conn, :run, "user_settings"))

      assert redirected_to(conn) == SkateWeb.Router.Helpers.unauthorized_path(conn, :index)
    end

    @tag :authenticated_admin
    test "successfully runs a report", %{conn: conn} do
      user = insert(:user)

      Skate.Repo.insert!(
        DbUserSettings.changeset(%DbUserSettings{}, %{
          user_id: user.id,
          ladder_page_vehicle_label: :vehicle_id,
          shuttle_page_vehicle_label: :run_id,
          vehicle_adherence_colors: :early_blue
        }),
        returning: true
      )

      response =
        conn
        |> get(SkateWeb.Router.Helpers.report_path(conn, :run, "user_settings"))
        |> response(200)

      assert response =~ "ladder_page_vehicle_label"
      assert response =~ "shuttle_page_vehicle_label"
      assert response =~ "vehicle_adherence_colors"
    end

    @tag :authenticated_admin
    test "returns 404 for invalid report", %{conn: conn} do
      conn = get(conn, SkateWeb.Router.Helpers.report_path(conn, :run, "not_a_report"))

      assert response(conn, 404) == "no report found"
    end
  end
end
