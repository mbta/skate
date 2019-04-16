defmodule Skate.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  def start(_type, _args) do
    import Supervisor.Spec

    runtime_config()

    # List all child processes to be supervised
    children = [
      # Start the endpoint when the application starts
      SkateWeb.Endpoint,
      # Starts a worker by calling: Skate.Worker.start_link(arg)
      # {Skate.Worker, arg},
      worker(Gtfs.HealthServer, []),
      worker(Gtfs, [Application.get_env(:skate, :gtfs_url)]),
      {Registry, keys: :duplicate, name: Realtime.Server.registry_name()},
      worker(Realtime.Server, [
        [
          url: Application.get_env(:skate, :concentrate_vehicle_positions_url),
          poll_delay: 3000
        ]
      ])
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_all, name: Skate.Supervisor]
    Supervisor.start_link(children, opts)
  end

  def runtime_config() do
    environment_variables = [
      gtfs_url: "SKATE_GTFS_URL",
      concentrate_vehicle_positions_url: "SKATE_CONCENTRATE_VEHICLE_POSITIONS_URL"
    ]

    for {application_key, environment_key} <- environment_variables do
      if value = System.get_env(environment_key) do
        Application.put_env(:skate, application_key, value)
      end
    end

    :ok
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  def config_change(changed, _new, removed) do
    SkateWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
