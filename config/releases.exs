import Config

alias Skate.SecretsManager

Application.ensure_all_started(:poison)
Application.ensure_all_started(:hackney)
Application.ensure_all_started(:ex_aws)
Application.ensure_all_started(:ex_aws_secretsmanager)

config :skate,
  secret_key_base: SecretsManager.fetch!("SECRET_KEY_BASE")

config :ueberauth, Ueberauth.Strategy.Cognito,
  client_secret: SecretsManager.fetch!("COGNITO_CLIENT_SECRET")

config :skate, SkateWeb.AuthManager, secret_key: SecretsManager.fetch!("GUARDIAN_SECRET_KEY")
