defmodule Skate.SecretsManagerTest do
  use ExUnit.Case, async: true
  import Test.Support.Helpers

  alias Skate.SecretsManager

  setup do
    System.put_env("ENVIRONMENT_NAME", "TEST")
    reassign_env(:skate, :get_secret_value_fn, fn _ -> "mock aws operation" end)
    reassign_env(:skate, :aws_request_fn, fn _ -> %{"SecretString" => "mock secret value"} end)
  end

  describe "fetch!/1" do
    test "returns the value of the requested secret speficit to the current environment" do
      assert SecretsManager.fetch!("test-key") == "mock secret value"
    end
  end

  describe "replace_env_in_key_name/1" do
    test "returns the SecretsManager version of the key name specific to the current environment" do
      assert SecretsManager.replace_env_in_key_name("ENV-test-key") == "TEST-test-key"
    end

    test "allows key names to not include the env" do
      assert SecretsManager.replace_env_in_key_name("test-key") == "test-key"
    end
  end
end
