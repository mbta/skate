defmodule Skate.Settings.UserSettingsTest do
  use Skate.DataCase

  import Skate.Repo

  alias Skate.Settings.UserSettings
  alias Skate.Settings.Db.User, as: DbUser
  alias Skate.Settings.Db.UserSettings, as: DbUserSettings

  describe "get_or_create" do
    test "gets settings for an existing user" do
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
          shuttle_page_vehicle_label: :run_id
        }),
        returning: true
      )

      result = UserSettings.get_or_create(username)

      assert result == %UserSettings{
               ladder_page_vehicle_label: :vehicle_id,
               shuttle_page_vehicle_label: :run_id
             }
    end

    test "for a new user, initializes and stores the default settings" do
      username = "username"
      result = UserSettings.get_or_create(username)

      assert result == %UserSettings{
               ladder_page_vehicle_label: :run_id,
               shuttle_page_vehicle_label: :vehicle_id
             }

      # created data for the new user
      assert [user_id] =
               Repo.all(from(user in "users", where: user.username == ^username, select: user.id))

      assert [^user_id] =
               Repo.all(
                 from(us in "user_settings", where: us.user_id == ^user_id, select: us.user_id)
               )
    end
  end

  describe "set" do
    test "can set a setting" do
      username = "username"
      UserSettings.get_or_create(username)
      UserSettings.set(username, :ladder_page_vehicle_label, :vehicle_id)
      result = UserSettings.get_or_create(username)
      assert result.ladder_page_vehicle_label == :vehicle_id
    end
  end
end
