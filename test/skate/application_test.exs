defmodule Skate.ApplicationTest do
  use ExUnit.Case, async: true
  import Test.Support.Helpers

  # TODO: some of these tests sometimes hit live AWS servers, causing
  # errors such as the following:
  #
  #   1) test load_runtime_config replaces {:secret, var_name} with secret from AWS SecretsManager (Skate.ApplicationTest)
  #    test/skate/application_test.exs:15
  #    ** (ExAws.Error) ExAws Request Error!
  #
  #    {:error, {:http_error, 400, %{body: "{\"__type\":\"AccessDeniedException\",\"Message\":\"User: arn:aws:iam::[REDACTED]:user/pdarnowsky is not authorized to perform: secretsmanager:GetSecretValue on resource: arn:aws:secretsmanager:us-east-1:[REDACTED]:secret:TEST-test-variable-REDACTED\"}", headers: [{"Date", "Mon, 07 Dec 2020 12:03:39 GMT"}, {"Content-Type", "application/x-amz-json-1.1"}, {"Content-Length", "246"}, {"Connection", "keep-alive"}, {"x-amzn-RequestId", "d2ed6c3d-c632-4eb8-9d88-439b30188920"}], status_code: 400}}}

  describe "load_runtime_config" do
    test "replaces {:system, \"VAR\"} with environment variable" do
      Application.put_env(:skate, :gtfs_url, {:system, "TEST_VARIABLE"})
      System.put_env("TEST_VARIABLE", "TEST VALUE")

      Skate.Application.load_runtime_config()

      assert Application.get_env(:skate, :gtfs_url) == "TEST VALUE"
    end

    test "replaces {:secret, var_name} with secret from AWS SecretsManager" do
      System.put_env("ENVIRONMENT_NAME", "TEST")

      reassign_env(:skate, :get_secret_value_fn, fn "TEST-test-variable" ->
        "mock aws operation"
      end)

      reassign_env(:skate, :aws_request_fn, fn _ -> %{"SecretString" => "TEST VALUE"} end)
      Application.put_env(:skate, :swiftly_authorization_key, {:secret, "ENV-test-variable"})

      Skate.Application.load_runtime_config()

      assert Application.get_env(:skate, :swiftly_authorization_key) == "TEST VALUE"
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
