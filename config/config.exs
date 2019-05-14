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
  concentrate_vehicle_positions_url: "https://cdn.mbta.com/realtime/VehiclePositions.json"

config :skate, Gtfs.CacheFile, cache_filename: nil

config :skate, :redirect_http?, false

# Configures the endpoint
config :skate, SkateWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "HjFPO4gzlDmAuvgXBMSd4MIFGLhvKHYfXpNkIoXRM5LMGxQhjYW0NQVdP2QFgZND",
  render_errors: [view: SkateWeb.ErrorView, accepts: ~w(html json)],
  pubsub: [name: Skate.PubSub, adapter: Phoenix.PubSub.PG2]

config :skate,
  sources: [
    gtfs_realtime: [
      vehicle_positions: "https://cdn.mbta.com/realtime/VehiclePositions.pb",
      trip_updates: "https://cdn.mbta.com/realtime/TripUpdates.pb"
    ]
  ],
  alerts: [
    url: "https://cdn.mbta.com/realtime/Alerts.pb"
  ],
  gtfs: [
    url: "https://cdn.mbta.com/MBTA_GTFS.zip"
  ],
  filters: [
    Concentrate.Filter.VehicleWithNoTrip,
    Concentrate.Filter.RoundSpeedToInteger,
    Concentrate.Filter.IncludeRouteDirection
  ],
  group_filters: [
    Concentrate.GroupFilter.TimeOutOfRange,
    Concentrate.GroupFilter.RemoveUnneededTimes,
    Concentrate.GroupFilter.VehiclePastStop,
    Concentrate.GroupFilter.Shuttle,
    Concentrate.GroupFilter.SkippedDepartures,
    Concentrate.GroupFilter.CancelledTrip,
    Concentrate.GroupFilter.ClosedStop,
    Concentrate.GroupFilter.VehicleAtSkippedStop,
    Concentrate.GroupFilter.VehicleStopMatch,
    Concentrate.GroupFilter.SkippedStopOnAddedTrip
  ],
  reporters: [
    Concentrate.Reporter.VehicleLatency,
    Concentrate.Reporter.StopTimeUpdateLatency,
    Concentrate.Reporter.Latency
  ],
  encoders: [
    files: [
      {"TripUpdates.pb", Concentrate.Encoder.TripUpdates},
      {"TripUpdates.json", Concentrate.Encoder.TripUpdates.JSON},
      {"VehiclePositions.pb", Concentrate.Encoder.VehiclePositions},
      {"VehiclePositions.json", Concentrate.Encoder.VehiclePositions.JSON},
      {"TripUpdates_enhanced.json", Concentrate.Encoder.TripUpdatesEnhanced}
    ]
  ],
  sinks: [
    filesystem: [directory: "/tmp"]
  ],
  file_tap: [
    enabled?: false
  ]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env()}.exs"
