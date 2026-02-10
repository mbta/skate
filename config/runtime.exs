import Config

Application.ensure_all_started(:poison)
Application.ensure_all_started(:hackney)
Application.ensure_all_started(:ex_aws)

config :skate,
  restrict_environment_access?: System.get_env("RESTRICT_ENVIRONMENT_ACCESS") == "true",
  base_tileset_url: System.get_env("BASE_TILESET_URL"),
  satellite_tileset_url: System.get_env("SATELLITE_TILESET_URL"),
  aws_place_index: System.get_env("AWS_PLACE_INDEX"),
  environment_name: System.get_env("ENVIRONMENT_NAME", "missing-env"),
  google_tag_manager_id: System.get_env("GOOGLE_TAG_MANAGER_ID"),
  tileset_url: System.get_env("TILESET_URL"),
  gtfs_url: System.get_env("GTFS_URL"),
  hastus_url: System.get_env("SKATE_HASTUS_URL"),
  busloc_url: System.get_env("BUSLOC_URL"),
  trip_updates_url: System.get_env("TRIP_UPDATES_URL"),
  fullstory_org: System.get_env("FULLSTORY_ORG")

# MBTA API
config :skate,
  api_key: System.get_env("API_KEY"),
  api_url: System.get_env("API_URL")

# Swiftly API
config :skate,
  swiftly_authorization_key: System.get_env("SWIFTLY_AUTHORIZATION_KEY"),
  swiftly_realtime_vehicles_url: System.get_env("SWIFTLY_REALTIME_VEHICLES_URL")

# Chelsea Bridge API
config :skate,
  bridge_api_password: System.get_env("BRIDGE_API_PASSWORD"),
  bridge_api_username: System.get_env("BRIDGE_API_USERNAME"),
  bridge_url: System.get_env("BRIDGE_URL")

if System.get_env("SECRET_KEY_BASE") do
  config :skate, SkateWeb.Endpoint, secret_key_base: System.get_env("SECRET_KEY_BASE")
end

config :skate, Skate.OpenRouteServiceAPI,
  api_base_url: System.get_env("OPEN_ROUTE_SERVICE_API_URL"),
  api_key: System.get_env("OPEN_ROUTE_SERVICE_API_KEY"),
  client: Skate.OpenRouteServiceAPI.Client

config :skate, Swiftly.API.ServiceAdjustments,
  base_url:
    (with(
       base_url_var when is_binary(base_url_var) <-
         System.get_env("SWIFTLY_SERVICE_ADJUSTMENTS_API_BASE_URL"),
       {:ok, uri} <- URI.new(base_url_var)
     ) do
       uri
     else
       _ ->
         nil
     end),
  api_key: System.get_env("SWIFTLY_SERVICE_ADJUSTMENTS_API_KEY"),
  agency: System.get_env("SWIFTLY_SERVICE_ADJUSTMENTS_AGENCY"),
  feed_id: "skate.#{System.get_env("ENVIRONMENT_NAME", "missing-env")}.service-adjustments",
  feed_name:
    "Skate (#{System.get_env("ENVIRONMENT_NAME", "missing-env")}) Service Adjustments Feed"

config :skate, SkateWeb.AuthManager, secret_key: System.get_env("GUARDIAN_SECRET_KEY")

pool_size =
  case Integer.parse(System.get_env("POOL_SIZE", "10")) do
    {size, _extra_binary} -> size
    :error -> 10
  end

config :skate, Skate.Repo, pool_size: pool_size

if config_env() == :prod do
  config :skate,
    geonames_token: System.get_env("GEONAMES_TOKEN")

  config :skate, SkateWeb.Endpoint,
    url: [host: System.get_env("HOST"), port: 80],
    static_url: [
      scheme: System.get_env("STATIC_SCHEME"),
      host: System.get_env("STATIC_HOST"),
      port: System.get_env("STATIC_PORT"),
      path: System.get_env("STATIC_PATH")
    ]

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

    # Configure TripModifications to publish if the env var is present
    config :skate, Skate.Detours.TripModificationPublisher, start: true
  end

  config :skate, DNSCluster, query: System.get_env("DNS_CLUSTER_QUERY") || :ignore
end
