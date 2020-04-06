use Mix.Config

config :skate,
  start_data_processes: false

config :skate, Static.CacheFile, cache_filename: "test_cache.terms"

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :skate, SkateWeb.Endpoint,
  http: [port: 4002],
  server: false,
  secret_key_base: "local_secret_key_base_at_least_64_bytes_________________________________"

config :skate, SkateWeb.AuthManager, secret_key: "dev key"

config :ueberauth, Ueberauth,
  providers: [
    cognito: {Skate.Ueberauth.Strategy.Fake, []}
  ]

config :logger, level: :warn
