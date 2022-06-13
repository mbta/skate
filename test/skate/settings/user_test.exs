defmodule Skate.Settings.UserTest do
  use Skate.DataCase

  alias Skate.Settings.User
  alias Skate.Settings.Db.User, as: DbUser

  describe "get_or_create/1" do
    test "assigns a UUID if none is present" do
      username = "username"

      Skate.Repo.insert!(DbUser.changeset(%DbUser{}, %{username: username}))

      user = User.get_or_create(username)

      refute is_nil(user.uuid)
    end

    test "keeps old UUID if present" do
      username = "username"

      user = User.get_or_create(username)

      new_user = User.get_or_create(username)

      assert user.uuid == new_user.uuid
    end
  end
end
