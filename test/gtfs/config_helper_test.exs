defmodule Gtfs.ConfigHelperTest do
  use ExUnit.Case, async: true

  alias Gtfs.ConfigHelper

  describe "get_string" do
    setup do
      Application.put_env(:test_skate, :test_string, "TEST VALUE")
    end

    test "returns a string application configuration value" do
      assert ConfigHelper.get_string(:test_string, :test_skate) == "TEST VALUE"
    end
  end

  describe "get_int" do
    setup do
      Application.put_env(:test_skate, :test_int, "42")
    end

    test "returns a string application configuration value" do
      assert ConfigHelper.get_int(:test_int, :test_skate) == 42
    end
  end
end
