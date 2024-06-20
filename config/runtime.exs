import Config

Application.ensure_all_started(:poison)
Application.ensure_all_started(:hackney)
Application.ensure_all_started(:ex_aws)

config :skate,
  restrict_environment_access?: System.get_env("RESTRICT_ENVIRONMENT_ACCESS") == "true",
  base_tileset_url: System.get_env("BASE_TILESET_URL"),
  satellite_tileset_url: System.get_env("SATELLITE_TILESET_URL"),
  aws_place_index: System.get_env("AWS_PLACE_INDEX"),
  environment_name: System.get_env("ENVIRONMENT_NAME", "missing-env")

if System.get_env("SECRET_KEY_BASE") do
  config :skate, SkateWeb.Endpoint, secret_key_base: System.get_env("SECRET_KEY_BASE")
end

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

  mqtt_url = System.get_env("MQTT_BROKER_URLS")

  if mqtt_url not in [nil, ""] do
    topic_prefix = System.get_env("MQTT_TOPIC_PREFIX", "")
    username = System.get_env("MQTT_BROKER_USERNAME")

    passwords =
      case System.get_env("MQTT_BROKER_PASSWORDS") do
        nil -> [nil]
        "" -> [nil]
        passwords -> String.split(passwords, " ")
      end

    configs =
      for url <- String.split(mqtt_url, " "),
          password <- passwords do
        EmqttFailover.Config.from_url(url, username: username, password: password)
      end

    config :skate, Skate.MqttConnection,
      enabled?: true,
      broker_configs: configs,
      broker_topic_prefix: topic_prefix

    config :skate, Skate.Detours.TripModificationPublisher, start: true
  end
end
