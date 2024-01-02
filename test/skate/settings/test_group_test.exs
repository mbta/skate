defmodule Skate.Settings.TestGroupTest do
  use Skate.DataCase

  alias Skate.Settings.TestGroup
  alias Skate.Settings.User

  describe "create/1" do
    test "creates the test group" do
      assert {:ok, %TestGroup{name: "group name"}} = TestGroup.create("group name")

      assert [%TestGroup{name: "group name"}] = TestGroup.get_all()
    end

    test "disallows blank group names" do
      assert {:error, changeset} = TestGroup.create("")

      assert %{errors: [name: {"can't be blank", _}]} = changeset
      assert Enum.empty?(TestGroup.get_all())
    end

    test "returns an error if the test group has a duplicate name" do
      TestGroup.create("duplicate name")
      assert {:error, changeset} = TestGroup.create("duplicate name")

      assert %{errors: [name: {"has already been taken", _}]} = changeset
      assert Enum.count(TestGroup.get_all()) == 1
    end

    test "strips leading and trailing spaces" do
      assert {:ok, %TestGroup{name: "lost in space"}} = TestGroup.create("  lost in space   ")

      assert [%TestGroup{name: "lost in space"}] = TestGroup.get_all()
    end

    test "treats names as duplicates if they differ by leading and trailing spaces" do
      TestGroup.create("lost in space   ")
      assert {:error, changeset} = TestGroup.create("     lost in space")

      assert %{errors: [name: {"has already been taken", _}]} = changeset
      assert Enum.count(TestGroup.get_all()) == 1
    end
  end

  describe "get/1" do
    test "retrieves the test group" do
      {:ok, test_group} = TestGroup.create("group name")
      assert %TestGroup{name: "group name"} = TestGroup.get(test_group.id)
    end

    test "returns nil when no group is found" do
      assert is_nil(TestGroup.get(123))
    end
  end

  describe "get_all/0" do
    test "gets all test groups" do
      {:ok, group1} = TestGroup.create("group 1")
      {:ok, group2} = TestGroup.create("group 2")

      all_groups = TestGroup.get_all()

      assert Enum.count(all_groups) == 2

      refute all_groups |> Enum.find(fn group -> group == group1 end) |> is_nil()
      refute all_groups |> Enum.find(fn group -> group == group2 end) |> is_nil()
    end
  end

  describe "get_override_enabled/0" do
    test "only retrieves test groups with the :enabled override" do
      {:ok, group1} = TestGroup.create("group 1")
      {:ok, _group2} = TestGroup.create("group 2")
      {:ok, _group3} = TestGroup.create("group 3")
      {:ok, group4} = TestGroup.create("group 4")

      TestGroup.update(%{group1 | override: :enabled})
      TestGroup.update(%{group4 | override: :enabled})

      groups = TestGroup.get_override_enabled()

      assert Enum.count(groups) == 2

      refute groups |> Enum.find(fn group -> group.name == "group 1" end) |> is_nil()
      refute groups |> Enum.find(fn group -> group.name == "group 4" end) |> is_nil()

      assert groups |> Enum.find(fn group -> group.name == "group 2" end) |> is_nil()
      assert groups |> Enum.find(fn group -> group.name == "group 3" end) |> is_nil()
    end
  end

  describe "update/1" do
    test "updates name" do
      {:ok, test_group} = TestGroup.create("name 1")

      new_test_group = TestGroup.update(%{test_group | name: "name 2"})

      assert new_test_group.name == "name 2"
    end

    test "updates users" do
      {:ok, test_group} = TestGroup.create("name")
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

    test "can set override to enabled" do
      {:ok, test_group} = TestGroup.create("group name")

      new_test_group = TestGroup.update(%{test_group | override: :enabled})

      assert new_test_group.override == :enabled
    end

    test "override defaults to :none" do
      {:ok, test_group} = TestGroup.create("group name")

      assert test_group.override == :none
    end
  end

  describe "delete/1" do
    test "deletes a test group" do
      {:ok, test_group} = TestGroup.create("group to delete")

      TestGroup.delete(test_group.id)

      assert Enum.empty?(TestGroup.get_all())
    end
  end
end
