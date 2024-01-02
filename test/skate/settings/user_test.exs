defmodule Skate.Settings.UserTest do
  use Skate.DataCase

  import Skate.Factory

  alias Skate.Settings.User
  alias Skate.Settings.Db.User, as: DbUser
  alias Skate.Settings.TestGroup
  @username "username"
  @email "user@test.com"

  describe "get_by_email/1" do
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

    test "raises error if email is nil" do
      assert_raise FunctionClauseError, fn -> User.get_by_email(nil) end
    end
  end

  describe "get_by_id/1" do
    test "returns user if one is found" do
      %{id: id} = user = User.upsert(@username, @email)
      assert user == User.get_by_id(id)
    end

    test "returns nil if no user found" do
      assert is_nil(User.get_by_id(1))
    end
  end

  describe "get_by_id!/1" do
    test "returns user if one is found" do
      %{id: id} = user = User.upsert(@username, @email)
      assert user == User.get_by_id!(id)
    end

    test "raises exception if no user found" do
      assert_raise Ecto.NoResultsError, fn -> User.get_by_id!(1) end
    end
  end

  describe "get_all/0" do
    test "returns all users" do
      user1 = User.upsert("user1", "user1@test.com")
      user2 = User.upsert("user2", "user2@test.com")

      users = User.get_all()

      assert length(users) == 2
      assert user1 in users
      assert user2 in users
    end
  end

  describe "upsert/1" do
    test "assigns a UUID if none is present" do
      insert(:user, %{username: @username, uuid: nil})

      user = User.upsert(@username, @email)

      refute is_nil(user.uuid)
    end

    test "keeps old UUID if present" do
      user = User.upsert(@username, @email)

      new_user = User.upsert(@username, @email)

      assert user.uuid == new_user.uuid
    end

    test "downcases email" do
      user = User.upsert(@username, String.capitalize(@email))
      assert length(Skate.Repo.all(DbUser)) == 1
      assert user.email == @email
    end

    test "if email address is associated with existing user with same username, no new record is inserted" do
      User.upsert(@username, @email)

      User.upsert(@username, @email)

      assert length(Skate.Repo.all(DbUser)) == 1
    end

    test "if email address is associated with existing user that has different username, returns existing user without updating their username" do
      User.upsert(@username, @email)

      new_user = User.upsert("newusername", @email)

      assert %{username: @username, email: @email} = new_user
      assert length(Skate.Repo.all(DbUser)) == 1

      refute is_nil(new_user.uuid)
    end

    test "raises error if email is nil" do
      assert_raise FunctionClauseError, fn -> User.upsert(@username, nil) end
    end

    test "raises error if email is empty string" do
      assert_raise FunctionClauseError, fn -> User.upsert(@username, "") end
    end
  end

  describe "is_in_test_group/2" do
    test "returns true only if given is in test group" do
      user_1 = User.upsert(@username, @email)
      user_2 = User.upsert("otheruser", "otheruser@test.com")
      {:ok, target_test_group} = TestGroup.create("target_test_group")
      {:ok, other_test_group} = TestGroup.create("other_test_group")

      target_test_group = TestGroup.update(%{target_test_group | users: [user_1, user_2]})
      other_test_group = TestGroup.update(%{other_test_group | users: [user_2]})
      assert User.is_in_test_group(user_1.id, target_test_group.name)
      refute User.is_in_test_group(user_1.id, other_test_group.name)
    end

    test "returns true if the test group has an override enabled" do
      user_1 = User.upsert(@username, @email)
      user_2 = User.upsert("otheruser", "otheruser@test.com")
      {:ok, overridden_test_group} = TestGroup.create("overridden_test_group")

      overridden_test_group = TestGroup.update(%{overridden_test_group | override: :enabled})
      assert User.is_in_test_group(user_1.id, overridden_test_group.name)
      assert User.is_in_test_group(user_2.id, overridden_test_group.name)
    end
  end

  describe "all_test_group_names/1" do
    test "returns an empty array if there are no test groups" do
      user = User.upsert("user", "user@test.com")

      assert User.all_test_group_names(User.get_by_id(user.id)) == []
    end

    test "returns a test group if the user is a member of it" do
      {:ok, test_group} = TestGroup.create("test-group")
      user = User.upsert("user", "user@test.com")

      TestGroup.update(%{test_group | users: [user]})

      assert User.all_test_group_names(User.get_by_id(user.id)) == ["test-group"]
    end

    test "does not include test groups that the user is not a member of" do
      TestGroup.create("test-group")
      user = User.upsert("user", "user@test.com")

      assert User.all_test_group_names(User.get_by_id(user.id)) == []
    end

    test "includes test groups that have an :enabled override" do
      {:ok, test_group} = TestGroup.create("test-group")
      user = User.upsert("user", "user@test.com")

      TestGroup.update(%{test_group | override: :enabled})

      assert User.all_test_group_names(User.get_by_id(user.id)) == ["test-group"]
    end

    test "does not include duplicate test group records" do
      {:ok, test_group} = TestGroup.create("test-group")
      user = User.upsert("user", "user@test.com")

      TestGroup.update(%{test_group | override: :enabled, users: [user]})

      assert User.all_test_group_names(User.get_by_id(user.id)) == ["test-group"]
    end
  end
end
