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
            Skate.Notifications.Supervisor,
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
          {Singleton.Supervisor, name: Skate.Singleton},
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
end
