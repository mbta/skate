defmodule Skate.Settings.LadderDirectionTest do
  use ExUnit.Case
  alias Skate.Settings.LadderDirection

  describe "cast/1" do
    test "works with valid value" do
      assert LadderDirection.cast(0) == {:ok, 0}
      assert LadderDirection.cast(1) == {:ok, 1}
    end

    test "returns error for invalid value" do
      assert LadderDirection.cast(2) == :error
    end
  end

  describe "load/1" do
    test "works with valid value" do
      assert LadderDirection.load(0) == {:ok, 0}
      assert LadderDirection.load(1) == {:ok, 1}
    end

    test "returns error for invalid value" do
      assert LadderDirection.load(2) == :error
    end
  end

  describe "dump/1" do
    test "works with valid value" do
      assert LadderDirection.dump(0) == {:ok, 0}
      assert LadderDirection.dump(1) == {:ok, 1}
    end

    test "returns error for invalid value" do
      assert LadderDirection.dump(2) == :error
    end
  end
end
