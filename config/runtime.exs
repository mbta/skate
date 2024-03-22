import Config

Application.ensure_all_started(:poison)
Application.ensure_all_started(:hackney)
Application.ensure_all_started(:ex_aws)

config :skate,
  restrict_environment_access?: System.get_env("RESTRICT_ENVIRONMENT_ACCESS") == "true",
  base_tileset_url: System.get_env("BASE_TILESET_URL"),
  satellite_tileset_url: System.get_env("SATELLITE_TILESET_URL"),
  aws_place_index: System.get_env("AWS_PLACE_INDEX")

config :skate, SkateWeb.Endpoint, secret_key_base: System.get_env("SECRET_KEY_BASE")

config :skate, Skate.OpenRouteServiceAPI,
  api_base_url: System.get_env("OPEN_ROUTE_SERVICE_API_URL"),
  api_key: System.get_env("OPEN_ROUTE_SERVICE_API_KEY"),
  client: Skate.OpenRouteServiceAPI.Client

config :ueberauth, Ueberauth.Strategy.Cognito,
  client_secret: System.get_env("COGNITO_CLIENT_SECRET")

config :skate, SkateWeb.AuthManager, secret_key: System.get_env("GUARDIAN_SECRET_KEY")

pool_size =
  case Integer.parse(System.get_env("POOL_SIZE", "10")) do
    {size, _extra_binary} -> size
    :error -> 10
  end

config :skate, Skate.Repo, pool_size: pool_size

if config_env() == :prod do
  # If this var is non-existent, we'll disable sentry by not setting `dsn`
  if System.get_env("SENTRY_BACKEND_DSN") do
    config :sentry,
      dsn: System.fetch_env!("SENTRY_BACKEND_DSN"),
      environment_name: System.fetch_env!("SENTRY_ENV")
  end

  if System.get_env("SENTRY_FRONTEND_DSN") do
    config :skate,
      sentry_frontend_dsn: System.fetch_env!("SENTRY_FRONTEND_DSN"),
      sentry_org_slug: System.fetch_env!("SENTRY_ORG_SLUG")
  end

  keycloak_opts = [
    issuer: :keycloak_issuer,
    client_id: System.fetch_env!("KEYCLOAK_CLIENT_ID"),
    client_secret: System.fetch_env!("KEYCLOAK_CLIENT_SECRET")
  ]

  config :ueberauth_oidcc,
    issuers: [
      %{
        name: :keycloak_issuer,
        issuer: System.fetch_env!("KEYCLOAK_ISSUER")
      }
    ],
    providers: [
      keycloak: keycloak_opts
    ]
end
