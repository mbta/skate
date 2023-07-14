import Config

Application.ensure_all_started(:poison)
Application.ensure_all_started(:hackney)
Application.ensure_all_started(:ex_aws)

config :skate,
  secret_key_base: System.get_env("SECRET_KEY_BASE"),
  restrict_environment_access?: System.get_env("RESTRICT_ENVIRONMENT_ACCESS") == "true",
  base_tileset_url: System.get_env("BASE_TILESET_URL"),
  satellite_tileset_url: System.get_env("SATELLITE_TILESET_URL"),
  aws_place_index: System.get_env("AWS_PLACE_INDEX")

config :ueberauth, Ueberauth.Strategy.Cognito,
  client_secret: System.get_env("COGNITO_CLIENT_SECRET")

config :skate, SkateWeb.AuthManager, secret_key: System.get_env("GUARDIAN_SECRET_KEY")

pool_size =
  case Integer.parse(System.get_env("POOL_SIZE", "10")) do
    {size, _extra_binary} -> size
    :error -> 10
  end

config :skate, Skate.Repo, pool_size: pool_size
