defmodule Skate.SecretsManager do
  @spec fetch!(String.t()) :: String.t()
  def fetch!(key_name) do
    if System.get_env("USE_SECRETS_MANAGER") do
      get_secret_value_fn =
        Application.get_env(
          :skate,
          :get_secret_value_fn,
          &ExAws.SecretsManager.get_secret_value/1
        )

      aws_request_fn = Application.get_env(:skate, :aws_request_fn, &ExAws.request!/1)

      key_name
      |> replace_env_in_key_name()
      |> get_secret_value_fn.()
      |> aws_request_fn.()
      |> Map.fetch!("SecretString")
    else
      key_name |> remove_env_in_key_name |> reformat_as_env_var |> System.get_env()
    end
  end

  @spec replace_env_in_key_name(String.t()) :: String.t()
  def replace_env_in_key_name(key_name) do
    String.replace(key_name, "ENV", System.get_env("ENVIRONMENT_NAME"))
  end

  def remove_env_in_key_name(key_name) do
    String.replace(key_name, "ENV-", "")
  end

  def reformat_as_env_var(key_name) do
    key_name |> String.replace("-", "_") |> String.upcase()
  end
end
