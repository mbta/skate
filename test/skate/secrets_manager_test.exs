defmodule Skate.SecretsManagerTest do
  use ExUnit.Case, async: true
  import Test.Support.Helpers

  alias Skate.SecretsManager

  setup do
    System.put_env("ENVIRONMENT_NAME", "TEST")
    reassign_env(:skate, :get_secret_value_fn, fn _ -> "mock response" end)
    reassign_env(:skate, :aws_request_fn, fn _ -> %{"SecretString" => "mock secret value"} end)
  end

  describe "fetch!/1" do
    test "returns the value of the requested secret speficit to the current environment" do
      assert SecretsManager.fetch!("test-key") == "mock secret value"
    end
  end

  describe "env_specific_key_name/1" do
    test "returns the SecretsManager version of the key name specific to the current environment" do
      assert SecretsManager.env_specific_key_name("TEST_KEY") == "TEST-test-key"
    end
  end

  describe "env/0" do
    test "returns the system environment name" do
      assert SecretsManager.env() == "TEST"
    end
  end

  describe "secret_key_name/1" do
    test "converts the key name from env format to SecretsManager format" do
      assert SecretsManager.secret_key_name("COGNITO_CLIENT_SECRET") == "cognito-client-secret"
    end
  end
end
