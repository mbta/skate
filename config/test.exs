use Mix.Config

config :skate, Gtfs.CacheFile, cache_filename: "test_cache.terms"

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :skate, SkateWeb.Endpoint,
  http: [port: 4002],
  server: false

# Print only warnings and errors during test
config :logger, level: :info
