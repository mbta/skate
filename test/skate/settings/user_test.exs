defmodule Skate.Settings.UserTest do
  use Skate.DataCase

  alias Skate.Settings.User
  alias Skate.Settings.Db.User, as: DbUser

  describe "get/1" do
    test "gets user by email" do
      username = "username"

      Skate.Repo.insert!(DbUser.changeset(%DbUser{}, %{username: username}))
      Skate.Repo.insert!(DbUser.changeset(%DbUser{}, %{username: "otheruser"}))

      assert %DbUser{username: ^username} = User.get(username)
    end

    test "raises if user not found" do
      assert_raise Ecto.NoResultsError, fn -> User.get("missinguser") end
    end
  end

  describe "upsert/1" do
    test "assigns a UUID if none is present" do
      username = "username"

      Skate.Repo.insert!(DbUser.changeset(%DbUser{}, %{username: username}))

      user = User.upsert(username)

      refute is_nil(user.uuid)
    end

    test "keeps old UUID if present" do
      username = "username"

      user = User.upsert(username)

      new_user = User.upsert(username)

      assert user.uuid == new_user.uuid
    end
  end
end
