defmodule Skate.SecretsManager do
  @spec fetch!(String.t()) :: String.t()
  def fetch!(key_name) do
    get_secret_value_fn =
      Application.get_env(:skate, :get_secret_value_fn, &ExAws.SecretsManager.get_secret_value/1)

    aws_request_fn = Application.get_env(:skate, :aws_request_fn, &ExAws.request!/1)

    key_name
    |> env_specific_key_name()
    |> get_secret_value_fn.()
    |> aws_request_fn.()
    |> Map.fetch!("SecretString")
  end

  @spec env_specific_key_name(String.t()) :: String.t()
  def env_specific_key_name(key_name) do
    env() <> "-" <> secret_key_name(key_name)
  end

  @spec env() :: String.t()
  def env do
    System.get_env("ENVIRONMENT_NAME")
  end

  @spec secret_key_name(String.t()) :: String.t()
  def secret_key_name(env_name) do
    env_name
    |> String.downcase()
    |> String.replace("_", "-")
  end
end
