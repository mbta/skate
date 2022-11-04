defmodule Skate.Settings.TestGroupTest do
  use Skate.DataCase

  alias Skate.Settings.TestGroup
  alias Skate.Settings.User

  describe "create/1" do
    test "creates the test group" do
      assert %TestGroup{name: "group name"} = TestGroup.create("group name")
    end
  end

  describe "get/1" do
    test "retrieves the test group" do
      test_group = TestGroup.create("group name")
      assert %TestGroup{name: "group name"} = TestGroup.get(test_group.id)
    end

    test "returns nil when no group is found" do
      assert is_nil(TestGroup.get(123))
    end
  end

  describe "get_all/1" do
    test "gets all test groups" do
      group1 = TestGroup.create("group 1")
      group2 = TestGroup.create("group 2")

      all_groups = TestGroup.get_all()

      assert Enum.count(all_groups) == 2

      refute all_groups |> Enum.find(fn group -> group == group1 end) |> is_nil()
      refute all_groups |> Enum.find(fn group -> group == group2 end) |> is_nil()
    end
  end

  describe "update/1" do
    test "updates name" do
      test_group = TestGroup.create("name 1")

      new_test_group = TestGroup.update(%{test_group | name: "name 2"})

      assert new_test_group.name == "name 2"
    end

    test "updates users" do
      test_group = TestGroup.create("name")
      user1 = User.upsert("user1", "user1@test.com")
      user2 = User.upsert("user2", "user2@test.com")
      user3 = User.upsert("user3", "user3@test.com")

      test_group_update_1 = TestGroup.update(%{test_group | users: [user1, user2]})

      %TestGroup{users: users_update_1} = test_group_update_1

      assert Enum.count(users_update_1) == 2
      assert user1 in users_update_1
      assert user2 in users_update_1

      test_group_update_2 = TestGroup.update(%{test_group_update_1 | users: [user2, user3]})

      %TestGroup{users: users_update_2} = test_group_update_2

      assert Enum.count(users_update_2) == 2
      assert user2 in users_update_2
      assert user3 in users_update_2
    end
  end
end
