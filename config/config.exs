# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

config :skate, ecto_repos: [Skate.Repo]

config :skate,
  # Default. Can be configured via environment variable, which is loaded in application.ex
  api_url: {:system, "API_URL"},
  api_key: {:system, "API_KEY"},
  restrict_environment_access?: false,
  google_tag_manager_id: {:system, "GOOGLE_TAG_MANAGER_ID"},
  tileset_url: {:system, "TILESET_URL"},
  gtfs_url: {:system, "GTFS_URL"},
  hastus_url: {:system, "SKATE_HASTUS_URL"},
  busloc_url: {:system, "BUSLOC_URL"},
  swiftly_authorization_key: {:system, "SWIFTLY_AUTHORIZATION_KEY"},
  swiftly_realtime_vehicles_url: {:system, "SWIFTLY_REALTIME_VEHICLES_URL"},
  trip_updates_url: {:system, "TRIP_UPDATES_URL"},
  bridge_requester: Bridge.Request,
  bridge_url: {:system, "BRIDGE_URL"},
  bridge_api_username: {:system, "BRIDGE_API_USERNAME"},
  bridge_api_password: {:system, "BRIDGE_API_PASSWORD"},
  start_data_processes: true,
  record_appcues: false,
  record_fullstory: false,
  fullstory_org: {:system, "FULLSTORY_ORG"},
  log_duration_timing: true,
  map_limits: %{
    north: 42.65,
    south: 42.05,
    east: -70.6,
    west: -71.55
  },
  redirect_http?: false,
  static_href: {SkateWeb.Router.Helpers, :static_path},
  timezone: "America/New_York",
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
        min_length: 5
      }
    ]
  },
  version: System.fetch_env!("SENTRY_RELEASE"),
  acceptable_use_policy:
    "https://mbta.sharepoint.com/:b:/s/CTD/ER2vUlgzH_xMuNTwKZHsvb0B80yH5XIQFLX7A4e6crycMA?e=GwAHOn",
  user_guide_url:
    "https://mbta.sharepoint.com/:b:/s/CTD/EaGzb7ta6GtBjfwSiUiO014B7qVDfSEIkCWMlpqomH7_cA?e=BHOpjY",
  training_url:
    "https://massdot.csod.com/ui/lms-learning-details/app/course/6287548c-c6a2-4e1e-9ed2-d6e4a445c855"

config :skate, Schedule.CacheFile, cache_filename: nil

# Configures the endpoint
config :skate, SkateWeb.Endpoint,
  url: [host: "localhost"],
  render_errors: [view: SkateWeb.ErrorHTML, accepts: ~w(html json)],
  pubsub_server: Skate.PubSub

config :skate, SkateWeb.AuthManager,
  issuer: "skate",
  secret_key: nil

config :skate, Skate.Repo,
  database: "skate_dev",
  username: System.get_env("POSTGRES_USERNAME", System.get_env("USER")),
  password: System.get_env("POSTGRES_PASSWORD", ""),
  hostname: System.get_env("POSTGRES_HOSTNAME", "localhost"),
  port: System.get_env("POSTGRES_PORT", "5432") |> String.to_integer(),
  show_sensitive_data_on_connection_error: true,
  backoff_min: 5_000

config :skate, Skate.WarmUp,
  minimum_percent_queries_to_succeed: 0.6,
  max_attempts: 20,
  seconds_between_attempts: 5

config :skate, Oban,
  repo: Skate.Repo,
  peer: Oban.Peers.Postgres,
  queues: [default: 10],
  plugins: [
    Oban.Plugins.Pruner,
    {
      Oban.Plugins.Cron,
      crontab: [
        {"*/15 * * * *", Skate.Oban.CleanUpNotifications,
         args: %{"cutoff_days" => 1, "limit" => 1000}}
      ]
    }
  ]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# "code" is the secret value returned by AWS to /auth/cognito/callback
log_filter_params =
  ~w(password code token guardian_default_claims guardian_default_resource guardian_default_token)

config :logster, :filter_parameters, log_filter_params

config :phoenix, :filter_parameters, log_filter_params

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Fake Cognito authentication
config :ueberauth, Ueberauth,
  providers: [
    cognito: nil,
    keycloak: nil
  ]

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env()}.exs"
