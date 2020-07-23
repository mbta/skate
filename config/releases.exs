import Config

alias Skate.SecretsManager

Application.ensure_all_started(:poison)
Application.ensure_all_started(:hackney)
Application.ensure_all_started(:ex_aws)
Application.ensure_all_started(:ex_aws_secretsmanager)

config :skate,
  secret_key_base: SecretsManager.fetch!("ENV-secret-key-base")

config :ueberauth, Ueberauth.Strategy.Cognito,
  client_secret: SecretsManager.fetch!("ENV-cognito-client-secret")

config :skate, SkateWeb.AuthManager, secret_key: SecretsManager.fetch!("ENV-guardian-secret-key")
