# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
use Mix.Config

config :skate,
  # Default. Can be configured via environment variable, which is loaded in application.ex
  api_url: {:system, "API_URL"},
  api_key: {:system, "API_KEY"},
  gtfs_url: {:system, "GTFS_URL"},
  hastus_url: {:system, "SKATE_HASTUS_URL"},
  busloc_url: {:system, "BUSLOC_URL"},
  swiftly_authorization_key: {:system, "SWIFTLY_AUTHORIZATION_KEY"},
  swiftly_realtime_vehicles_url: {:system, "SWIFTLY_REALTIME_VEHICLES_URL"},
  trip_updates_url: {:system, "TRIP_UPDATES_URL"},
  start_data_processes: true,
  record_fullstory: false,
  record_appcues: false,
  log_duration_timing: true,
  refresh_token_store: RefreshTokenStore,
  redirect_http?: false,
  static_href: {SkateWeb.Router.Helpers, :static_path},
  schedule_health_checks: %{
    routes: %{
      min_length: 100
    },
    timepoints: [
      %{
        route_id: "32",
        min_length: 5
      },
      %{
        route_id: "71",
        min_length: 5
      },
      %{
        route_id: "220",
        min_length: 5
      },
      %{
        route_id: "450",
        min_length: 5
      },
      %{
        route_id: "742",
        min_length: 5
      }
    ],
    trip_stop_times: [
      %{
        route_id: "32",
        min_length: 10
      },
      %{
        route_id: "71",
        min_length: 10
      },
      %{
        route_id: "220",
        min_length: 10
      },
      %{
        route_id: "450",
        min_length: 10
      },
      %{
        route_id: "742",
        min_length: 10
      }
    ]
  }

config :skate, Schedule.CacheFile, cache_filename: nil

# Configures the endpoint
config :skate, SkateWeb.Endpoint,
  url: [host: "localhost"],
  render_errors: [view: SkateWeb.ErrorView, accepts: ~w(html json)],
  pubsub: [name: Skate.PubSub, adapter: Phoenix.PubSub.PG2]

config :skate, SkateWeb.AuthManager,
  issuer: "skate",
  secret_key: nil

config :laboratory,
  features: [
    {:headway_ladder_colors, "Headway Route Ladder Colors",
     "Turns on colored headway spacing lines on key route route ladders showing when service is bunched or gapped."}
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
