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

  describe "update_static_url/1" do
    setup do
      System.put_env("STATIC_SCHEME", "TEST_STATIC_SCHEME_VALUE")
      System.put_env("STATIC_HOST", "TEST_STATIC_HOST_VALUE")
      System.put_env("STATIC_PORT", "TEST_STATIC_PORT_VALUE")
    end

    test "parses static_url configuration from env variables" do
      initial_endpoint_config = [
        url: [host: "localhost"],
        http: [port: 4000],
        static_url: [
          scheme: {:system, "STATIC_SCHEME"},
          host: {:system, "STATIC_HOST"},
          port: {:system, "STATIC_PORT"},
          path: "RAW_TEST_STATIC_PATH_VALUE"
        ],
        debug_errors: true
      ]

      expected_endpoint_config = [
        url: [host: "localhost"],
        http: [port: 4000],
        static_url: [
          scheme: "TEST_STATIC_SCHEME_VALUE",
          host: "TEST_STATIC_HOST_VALUE",
          port: "TEST_STATIC_PORT_VALUE",
          path: "RAW_TEST_STATIC_PATH_VALUE"
        ],
        debug_errors: true
      ]

      assert Skate.Application.update_static_url(initial_endpoint_config) ==
               expected_endpoint_config
    end
  end
end
