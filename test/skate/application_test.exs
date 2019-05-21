defmodule Skate.ApplicationTest do
  use ExUnit.Case, async: true

  describe "get_config_string/1" do
    setup do
      Application.put_env(:skate, :test_string, "TEST VALUE")
    end

    test "returns a string application configuration value" do
      assert Skate.Application.get_config_string(:test_string) == "TEST VALUE"
    end
  end
end
