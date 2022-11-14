defmodule Skate.Settings.UserSettingsTest do
  use Skate.DataCase

  import Skate.Repo

  alias Skate.Settings.User
  alias Skate.Settings.UserSettings
  alias Skate.Settings.Db.UserSettings, as: DbUserSettings

  @username "username"
  @email "user@test.com"

  setup do
    {:ok, %{user: User.upsert(@username, @email)}}
  end

  describe "get_or_create" do
    test "gets settings for an existing user", %{user: user} do
      insert!(
        DbUserSettings.changeset(%DbUserSettings{}, %{
          user_id: user.id,
          ladder_page_vehicle_label: :vehicle_id,
          shuttle_page_vehicle_label: :run_id,
          vehicle_adherence_colors: :early_blue
        }),
        returning: true
      )

      result = UserSettings.get_or_create(user.id)

      assert result == %UserSettings{
               ladder_page_vehicle_label: :vehicle_id,
               shuttle_page_vehicle_label: :run_id,
               vehicle_adherence_colors: :early_blue
             }
    end

    test "for a new user, initializes and stores the default settings", %{user: user} do
      result = UserSettings.get_or_create(user.id)

      assert result == %UserSettings{
               ladder_page_vehicle_label: :run_id,
               shuttle_page_vehicle_label: :vehicle_id,
               vehicle_adherence_colors: :early_red
             }

      # created data for the new user
      assert [user_id] =
               Repo.all(
                 from(user in "users", where: user.username == ^@username, select: user.id)
               )

      assert [^user_id] =
               Repo.all(
                 from(us in "user_settings", where: us.user_id == ^user_id, select: us.user_id)
               )
    end
  end

  describe "set" do
    test "can set a setting", %{user: user} do
      UserSettings.get_or_create(user.id)
      UserSettings.set(user.id, :ladder_page_vehicle_label, :vehicle_id)
      result = UserSettings.get_or_create(user.id)
      assert result.ladder_page_vehicle_label == :vehicle_id
    end
  end
end
