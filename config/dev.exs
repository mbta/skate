import Config

config :skate,
  geonames_url_base: "http://api.geonames.org",
  log_duration_timing: false,
  enable_drift: false

config :skate, Schedule.CacheFile, cache_filename: "dev_cache.terms"

# Don't require local MQTT setup by default
config :skate, Skate.Detours.TripModificationPublisher, start: false

# For development, we disable any cache and enable
# debugging and code reloading.
#
# The watchers configuration can be used to run external
# watchers to your application. For example, we use it
# with webpack to recompile .js and .css sources.
config :skate, SkateWeb.Endpoint,
  https: [
    ip: {0, 0, 0, 0},
    port: System.get_env("PORT") || 4000,
    cipher_suite: :strong,
    keyfile: "priv/cert/selfsigned_key.pem",
    certfile: "priv/cert/selfsigned.pem",
    compress: true
  ],
  debug_errors: true,
  code_reloader: true,
  check_origin: false,
  watchers: [
    node: [
      "node_modules/webpack/bin/webpack.js",
      "--mode",
      "development",
      "--watch",
      "--watch-options-stdin",
      cd: Path.expand("../assets", __DIR__)
    ]
  ]

config :skate, SkateWeb.AuthManager, secret_key: "dev key"

config :ex_aws,
  access_key_id: [{:system, "AWS_ACCESS_KEY_ID"}, {:awscli, "default", 30}],
  secret_access_key: [{:system, "AWS_SECRET_ACCESS_KEY"}, {:awscli, "default", 30}]

config :ueberauth, Ueberauth,
  providers: [
    keycloak:
      {Skate.Ueberauth.Strategy.Fake,
       [groups: ["skate-readonly", "skate-dispatcher", "skate-admin"]]}
  ]

config :ueberauth_oidcc,
  providers: [
    keycloak: [
      issuer: :keycloak_issuer,
      client_id: "dev-client",
      client_secret: "fake-secret"
    ]
  ]

config :logger, level: :notice

# Watch static and templates for browser reloading.
config :skate, SkateWeb.Endpoint,
  live_reload: [
    patterns: [
      ~r{priv/static/.*(js|css|png|jpeg|jpg|gif|svg)$},
      ~r{lib/skate_web/views/.*(ex)$},
      ~r{lib/skate_web/templates/.*(eex)$}
    ]
  ]

config :skate, Skate.Repo, database: "skate_dev"

# Do not include metadata nor timestamps in development logs
config :logger, :console,
  format: "[$level] $metadata$message\n",
  metadata: [:mfa]

# Set a higher stacktrace during development. Avoid configuring such
# in production as building large stacktraces may be expensive.
config :phoenix, :stacktrace_depth, 20

# Initialize plugs at runtime for faster development compilation
config :phoenix, :plug_init_mode, :runtime

# Don't report issues with migrations from before we introduced excellent_migrations
config :excellent_migrations,
  start_after: "20230908133314",
  skip_checks: [:column_added_with_default]
