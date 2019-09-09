# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
use Mix.Config

config :skate,
  # Default. Can be configured via environment variable, which is loaded in application.ex
  gtfs_url: "https://cdn.mbta.com/MBTA_GTFS.zip",
  busloc_url: {:system, "BUSLOC_URL"},
  swiftly_authorization_key: {:system, "SWIFTLY_AUTHORIZATION_KEY"},
  swiftly_realtime_vehicles_url: {:system, "SWIFTLY_REALTIME_VEHICLES_URL"},
  secret: {:system, "SKATE_SECRET"},
  signed_secret: {:system, "SKATE_SIGNED_SECRET"},
  start_data_processes: true,
  record_fullstory: false,
  log_duration_timing: true,
  refresh_token_store: RefreshTokenStore

config :skate, Gtfs.CacheFile, cache_filename: nil

config :skate, :redirect_http?, false

# Configures the endpoint
config :skate, SkateWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "HjFPO4gzlDmAuvgXBMSd4MIFGLhvKHYfXpNkIoXRM5LMGxQhjYW0NQVdP2QFgZND",
  render_errors: [view: SkateWeb.ErrorView, accepts: ~w(html json)],
  pubsub: [name: Skate.PubSub, adapter: Phoenix.PubSub.PG2]

config :skate, SkateWeb.AuthManager,
  issuer: "skate",
  secret_key: nil

config :laboratory,
  features: [
    {:headway_ladder_colors, "Headway Route Ladder Colors",
     "Turns on colored headway spacing lines on key route route ladders showing when service is bunched or gapped."},
    {:ghost_buses, "Ghost Buses", "Displays ghost buses on route ladders"}
  ],
  cookie: [
    # one month,
    max_age: 3600 * 24 * 30,
    http_only: true
  ]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Fake Cognito authentication
config :ueberauth, Ueberauth,
  providers: [
    cognito: nil
  ]

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env()}.exs"
