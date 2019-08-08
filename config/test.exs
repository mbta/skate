use Mix.Config

config :skate, Gtfs.CacheFile, cache_filename: "test_cache.terms"

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :skate, SkateWeb.Endpoint,
  http: [port: 4002],
  server: false

config :skate, SkateWeb.AuthManager, secret_key: "dev key"

config :ueberauth, Ueberauth,
  providers: [
    cognito: {Skate.Ueberauth.Strategy.Fake, []}
  ]

config :logger, level: :info
