defmodule Skate.Settings.UserTest do
  use Skate.DataCase

  alias Skate.Settings.User
  alias Skate.Settings.Db.User, as: DbUser
  @username "username"
  @email "user@test.com"

  describe "get/1" do
    test "gets user by username" do
      Skate.Repo.insert!(DbUser.changeset(%DbUser{}, %{username: @username}))
      Skate.Repo.insert!(DbUser.changeset(%DbUser{}, %{username: "otheruser"}))

      assert %DbUser{username: @username} = User.get(@username)
    end

    test "raises if user not found" do
      assert_raise Ecto.NoResultsError, fn -> User.get("missinguser") end
    end
  end

  describe "get_by/1" do
    test "returns nil if no match" do
      assert nil == User.get_by_email("missingemail@test.com")
    end

    test "returns exact matching email" do
      username = "user1"
      email = "user1@test.com"
      User.upsert(username, email)
      assert %{username: ^username, email: ^email} = User.get_by_email(email)
    end

    test "matches ignoring case" do
      username = "user1"
      email = "user1@test.com"
      User.upsert(username, email)
      assert %{username: ^username, email: ^email} = User.get_by_email(String.capitalize(email))
    end
  end

  describe "upsert/1" do
    test "assigns a UUID if none is present" do
      Skate.Repo.insert!(DbUser.changeset(%DbUser{}, %{username: @username}))

      user = User.upsert(@username, @email)

      refute is_nil(user.uuid)
    end

    test "keeps old UUID if present" do
      user = User.upsert(@username, @email)

      new_user = User.upsert(@username, @email)

      assert user.uuid == new_user.uuid
    end

    test "assigns email address to existing user record" do
      Skate.Repo.insert!(DbUser.changeset(%DbUser{}, %{username: @username}))

      user = User.upsert(@username, @email)
      assert length(Skate.Repo.all(DbUser)) == 1
      assert user.email == @email
    end

    test "downcases email" do
      Skate.Repo.insert!(DbUser.changeset(%DbUser{}, %{username: @username}))

      user = User.upsert(@username, String.capitalize(@email))
      assert length(Skate.Repo.all(DbUser)) == 1
      assert user.email == @email
    end

    test "if email address is associated with existing user with same username, no new record is inserted" do
      User.upsert(@username, @email)

      User.upsert(@username, @email)

      assert length(Skate.Repo.all(DbUser)) == 1
    end

    test "if email address is associated with existing user that has different username, creates new user without email" do
      originalUser = User.upsert(@username, @email)

      newUser = User.upsert("newusername", @email)

      assert %{username: @username, email: @email} = originalUser
      assert %{username: "newusername", email: nil} = newUser
      refute is_nil(newUser.uuid)
    end
  end
end
