import Config

config :skate, start_data_processes: false

config :skate, Schedule.CacheFile, cache_filename: "test_cache.terms"

config :skate, Schedule.Timepoint, hints: fn -> %{} end

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :skate, SkateWeb.Endpoint,
  http: [port: 4002],
  server: false,
  secret_key_base: "local_secret_key_base_at_least_64_bytes_________________________________"

config :skate, SkateWeb.AuthManager, secret_key: "dev key"

config :skate, Skate.Repo,
  adapter: Ecto.Adapters.Postgres,
  database: "skate_test",
  pool: Ecto.Adapters.SQL.Sandbox

config :skate, Oban, testing: :inline

config :ueberauth, Ueberauth,
  providers: [
    cognito: {Skate.Ueberauth.Strategy.Fake, [groups: ["skate-dispatcher", "skate-nav-beta"]]}
  ]

config :logger, level: :warn
