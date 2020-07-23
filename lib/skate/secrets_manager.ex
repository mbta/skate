defmodule Skate.SecretsManager do
  @spec fetch!(String.t()) :: String.t()
  def fetch!(key_name) do
    get_secret_value_fn =
      Application.get_env(:skate, :get_secret_value_fn, &ExAws.SecretsManager.get_secret_value/1)

    aws_request_fn = Application.get_env(:skate, :aws_request_fn, &ExAws.request!/1)

    key_name
    |> replace_env_in_key_name()
    |> get_secret_value_fn.()
    |> aws_request_fn.()
    |> Map.fetch!("SecretString")
  end

  @spec replace_env_in_key_name(String.t()) :: String.t()
  def replace_env_in_key_name(key_name) do
    String.replace(key_name, "ENV", System.get_env("ENVIRONMENT_NAME"))
  end
end
