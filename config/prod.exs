use Mix.Config

config :skate,
  api_key: {:secret, "ENV-api-key"},
  geonames_url_base: "https://ba-secure.geonames.net",
  geonames_token: {:secret, "geonames-token"},
  redirect_http?: true,
  record_fullstory: true,
  record_appcues: true,
  record_sentry: true,
  secret_key_base: {:secret, "ENV-secret-key-base"},
  static_href: {SkateWeb.Router.Helpers, :static_url},
  swiftly_authorization_key: {:secret, "ENV-swiftly-authorization-key"}

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
  http: [:inet6, port: System.get_env("PORT") || 4000],
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

# Do not print debug messages in production
config :logger, level: :info

config :logger, :console,
  format: "$time $metadata[$level] node=$node $message\n",
  metadata: [:request_id]

# Configure Ueberauth to use Cognito
config :ueberauth, Ueberauth,
  providers: [
    cognito: {Ueberauth.Strategy.Cognito, []}
  ]

config :ueberauth, Ueberauth.Strategy.Cognito,
  auth_domain: {System, :get_env, ["COGNITO_DOMAIN"]},
  client_id: {System, :get_env, ["COGNITO_CLIENT_ID"]},
  user_pool_id: {System, :get_env, ["COGNITO_USER_POOL_ID"]},
  aws_region: {System, :get_env, ["COGNITO_AWS_REGION"]}

config :ex_aws, json_codec: Jason

config :ehmon, :report_mf, {:ehmon, :info_report}
