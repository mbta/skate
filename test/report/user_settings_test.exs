defmodule Report.UserSettingsTest do
  use Skate.DataCase

  import Skate.Repo

  alias Skate.Settings.Db.User, as: DbUser
  alias Skate.Settings.Db.UserSettings, as: DbUserSettings

  describe "run/0" do
    test "returns database contents" do
      username = "username"

      user =
        insert!(
          DbUser.changeset(%DbUser{}, %{username: username}),
          returning: true
        )

      insert!(
        DbUserSettings.changeset(%DbUserSettings{}, %{
          user_id: user.id,
          ladder_page_vehicle_label: :vehicle_id,
          shuttle_page_vehicle_label: :run_id,
          vehicle_adherence_colors: :early_blue,
          minischedules_trip_label: :origin
        }),
        returning: true
      )

      {:ok, result} = Report.UserSettings.run()

      assert result == [
               %{
                 "ladder_page_vehicle_label" => :vehicle_id,
                 "shuttle_page_vehicle_label" => :run_id,
                 "vehicle_adherence_colors" => :early_blue
               }
             ]
    end
  end

  describe "short_name/0" do
    test "returns short name" do
      assert Report.UserSettings.short_name() == "user_settings"
    end
  end

  describe "description/0" do
    test "returns description" do
      assert Report.UserSettings.description() == "User settings"
    end
  end
end
