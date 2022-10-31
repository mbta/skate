defmodule Skate.Settings.TestGroupTest do
  use Skate.DataCase

  alias Skate.Settings.TestGroup

  describe "create/1" do
    test "creates the test group" do
      assert %TestGroup{name: "group name"} = TestGroup.create("group name")
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
end
