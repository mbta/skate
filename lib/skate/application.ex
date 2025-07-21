defmodule Skate.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application
  require Logger

  @version Application.compile_env(:skate, :version)

  @impl true
  def start(_type, _args) do
    Logger.info("Skate application starting, deployment_id=#{@version}")

    load_runtime_config()

    start_data_processes? = Application.get_env(:skate, :start_data_processes)

    Skate.Telemetry.setup_telemetry()

    # List all child processes to be supervised
    children =
      [{Skate.Repo, []}] ++
        if start_data_processes? do
          [
            Schedule.Supervisor
          ]
        else
          []
        end ++
        [Skate.WarmUp] ++
        if start_data_processes? do
          [
            TrainVehicles.Supervisor,
            Notifications.Supervisor,
            {Skate.Detours.NotificationScheduler.Server,
             name: Skate.Detours.NotificationScheduler.Server.default_name(),
             poll_ms: Skate.Detours.NotificationScheduler.Server.poll_ms()},
            Realtime.Supervisor
          ]
        else
          []
        end ++
        [
          {Phoenix.PubSub, name: Skate.PubSub},
          {DNSCluster, Application.get_env(:skate, DNSCluster)},
          SkateWeb.Endpoint,
          Skate.Migrate,
          {Oban, Application.fetch_env!(:skate, Oban)},
          {Skate.Detours.TripModificationPublisher,
           Application.get_env(:skate, Skate.Detours.TripModificationPublisher)},
          Skate.Detours.FeedSynchronizer
        ]

    Supervisor.start_link(children, strategy: :rest_for_one, name: Skate.Supervisor)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  @spec config_change(any, any, any) :: :ok
  def config_change(changed, _new, removed) do
    SkateWeb.Endpoint.config_change(changed, removed)
    :ok
  end

  @doc """
  Check system environment variables at runtime and load them into the application environment.

  Will recursively check the keys below in the application config for any {:system, "ENVIRONMENT_VARIABLE"},
  and replace them with the value in the given environment variable.

  """
  @spec load_runtime_config() :: :ok
  def load_runtime_config() do
    application_keys = [
      :google_tag_manager_id,
      :tileset_url,
      :gtfs_url,
      :hastus_url,
      :busloc_url,
      :trip_updates_url,
      :geonames_url_base,
      :geonames_token,
      :sentry_frontend_dsn,
      :sentry_environment,
      :sentry_org_slug,
      :fullstory_org,
      SkateWeb.Endpoint,
      Skate.Repo
    ]

    for application_key <- application_keys do
      Application.put_env(
        :skate,
        application_key,
        runtime_config(Application.get_env(:skate, application_key))
      )
    end

    :ok
  end

  @spec runtime_config(any()) :: any()
  defp runtime_config(list) when is_list(list) do
    Enum.map(list, fn elem ->
      case elem do
        {key, value} when is_atom(key) ->
          {key, runtime_config(value)}

        _ ->
          elem
      end
    end)
  end

  defp runtime_config({:system, environment_variable}) do
    System.get_env(environment_variable)
  end

  defp runtime_config(value) do
    value
  end
end
