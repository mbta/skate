import Config

config :skate,
  geonames_url_base: "https://ba-secure.geonames.net",
  geonames_token: {:system, "GEONAMES_TOKEN"},
  redirect_http?: true,
  record_appcues: true,
  record_fullstory: true,
  record_sentry: true,
  static_href: {SkateWeb.Router.Helpers, :static_url}

config :sentry,
  release: System.get_env("SENTRY_RELEASE")

# For production, don't forget to configure the url host
# to something meaningful, Phoenix uses this information
# when generating URLs.
#
# Note we also include the path to a cache manifest
# containing the digested version of static files. This
# manifest is generated by the `mix phx.digest` task,
# which you should run after static files are built and
# before starting your production server.
config :skate, SkateWeb.Endpoint,
  server: true,
  http: [:inet6, port: System.get_env("PORT") || 4000, compress: true],
  url: [host: {:system, "HOST"}, port: 80],
  static_url: [
    scheme: {:system, "STATIC_SCHEME"},
    host: {:system, "STATIC_HOST"},
    port: {:system, "STATIC_PORT"},
    path: {:system, "STATIC_PATH"}
  ],
  cache_static_manifest: "priv/static/cache_manifest.json"

config :skate, :websocket_check_origin, [
  "https://*.mbta.com",
  "https://*.mbtace.com"
]

config :skate, Skate.Repo,
  database: "skate",
  ssl: true,
  show_sensitive_data_on_connection_error: false,
  configure: {Skate.Repo, :add_prod_credentials, []}

# Do not print debug messages in production
config :logger, level: :info

config :logger, :console,
  format: "$time $metadata[$level] node=$node $message\n",
  metadata: [:mfa, :request_id]

# Configure Ueberauth to use Cognito / Keycloak
config :ueberauth, Ueberauth,
  providers: [
    cognito: {Ueberauth.Strategy.Cognito, []},
    keycloak:
      {Ueberauth.Strategy.Oidcc, userinfo: true, uid_field: "email", scopes: ~w(openid email)}
  ]

config :ueberauth, Ueberauth.Strategy.Cognito,
  auth_domain: {System, :get_env, ["COGNITO_DOMAIN"]},
  client_id: {System, :get_env, ["COGNITO_CLIENT_ID"]},
  user_pool_id: {System, :get_env, ["COGNITO_USER_POOL_ID"]},
  aws_region: {System, :get_env, ["COGNITO_AWS_REGION"]}

config :ex_aws, json_codec: Jason

config :ehmon, :report_mf, {:ehmon, :info_report}
