import Config

Application.ensure_all_started(:poison)
Application.ensure_all_started(:hackney)
Application.ensure_all_started(:ex_aws)

config :skate,
  secret_key_base: System.get_env("SECRET_KEY_BASE")

config :ueberauth, Ueberauth.Strategy.Cognito,
  client_secret: System.get_env("COGNITO_CLIENT_SECRET")

config :skate, SkateWeb.AuthManager, secret_key: System.get_env("GUARDIAN_SECRET_KEY")
