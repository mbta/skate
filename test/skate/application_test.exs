defmodule Skate.ApplicationTest do
  use ExUnit.Case, async: true

  describe "load_runtime_config" do
    test "replaces {:system, \"VAR\"} with environment variable" do
      Application.put_env(:skate, :gtfs_url, {:system, "TEST_VARIABLE"})
      System.put_env("TEST_VARIABLE", "TEST VALUE")

      Skate.Application.load_runtime_config()

      assert Application.get_env(:skate, :gtfs_url) == "TEST VALUE"
    end

    test "leaves other values alone" do
      Application.put_env(:skate, :gtfs_url, "TEST VALUE 1")
      System.put_env("TEST_VARIABLE", "TEST VALUE 2")

      Skate.Application.load_runtime_config()

      assert Application.get_env(:skate, :gtfs_url) == "TEST VALUE 1"
    end

    test "recurses" do
      Application.put_env(:skate, :gtfs_url, sub_config: {:system, "TEST_VARIABLE"})
      System.put_env("TEST_VARIABLE", "TEST VALUE")

      Skate.Application.load_runtime_config()

      assert Application.get_env(:skate, :gtfs_url) == [sub_config: "TEST VALUE"]
    end

    test "updates static url" do
      System.put_env("STATIC_SCHEME", "TEST_STATIC_SCHEME_VALUE")
      System.put_env("STATIC_HOST", "TEST_STATIC_HOST_VALUE")
      System.put_env("STATIC_PORT", "TEST_STATIC_PORT_VALUE")

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

      Application.put_env(:skate, SkateWeb.Endpoint, initial_endpoint_config)

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

      Skate.Application.load_runtime_config()

      assert Application.get_env(:skate, SkateWeb.Endpoint) == expected_endpoint_config
    end
  end
end
