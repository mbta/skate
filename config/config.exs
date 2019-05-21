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
  concentrate_vehicle_positions_url:
    {:system, "CONCENTRATE_VEHICLE_POSITIONS_URL",
     "https://cdn.mbta.com/realtime/VehiclePositions.json"},
  busloc_url: {:system, "BUSLOC_URL", nil}

config :skate, Gtfs.CacheFile, cache_filename: nil

config :skate, :redirect_http?, false

# Configures the endpoint
config :skate, SkateWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "HjFPO4gzlDmAuvgXBMSd4MIFGLhvKHYfXpNkIoXRM5LMGxQhjYW0NQVdP2QFgZND",
  render_errors: [view: SkateWeb.ErrorView, accepts: ~w(html json)],
  pubsub: [name: Skate.PubSub, adapter: Phoenix.PubSub.PG2]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env()}.exs"
