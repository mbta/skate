defmodule Skate.SettingsTest do
  use Skate.DataCase

  import Skate.Repo

  alias Skate.Settings
  alias Skate.Settings.User
  alias Skate.Settings.UserSettings

  describe "get_or_create" do
    test "gets settings for an existing user" do
      username = "username"

      user =
        insert!(
          User.changeset(%User{}, %{username: username}),
          returning: true
        )

      insert!(
        UserSettings.changeset(%UserSettings{}, %{
          user_id: user.id,
          ladder_page_vehicle_label: :vehicle_id,
          shuttle_page_vehicle_label: :run_id
        }),
        returning: true
      )

      result = Settings.get_or_create(username)

      assert result == %Settings{
               ladder_page_vehicle_label: :vehicle_id,
               shuttle_page_vehicle_label: :run_id
             }
    end

    test "for a new user, initializes and stores the default settings" do
      username = "username"
      result = Settings.get_or_create(username)

      assert result == %Settings{
               ladder_page_vehicle_label: :run_id,
               shuttle_page_vehicle_label: :vehicle_id
             }

      assert Repo.all(
               from(user in "users", where: user.username == ^username, select: user.username)
             ) == [username]

      assert [_id] = Repo.all(from(us in "user_settings", select: us.user_id))
    end
  end
end
