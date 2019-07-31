defmodule Skate.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  def start(_type, _args) do
    import Supervisor.Spec

    runtime_config()

    # Pull the STATIC_SCHEME variable out of the environment
    Application.put_env(
      :skate,
      SkateWeb.Endpoint,
      update_static_url(Application.get_env(:skate, SkateWeb.Endpoint))
    )

    # List all child processes to be supervised
    children = [
      # Start the endpoint when the application starts
      SkateWeb.Endpoint,
      # Starts a worker by calling: Skate.Worker.start_link(arg)
      # {Skate.Worker, arg},
      worker(Gtfs.HealthServer, []),
      worker(Gtfs, [Application.get_env(:skate, :gtfs_url)]),
      worker(
        Concentrate.Supervisor,
        [
          [
            busloc_url: get_config_string(:busloc_url),
            swiftly_authorization_key: get_config_string(:swiftly_authorization_key),
            swiftly_realtime_vehicles_url: get_config_string(:swiftly_realtime_vehicles_url)
          ]
        ]
      ),
      {Registry, keys: :duplicate, name: Realtime.Server.registry_name()},
      worker(Realtime.Server, [[name: Realtime.Server.default_name()]])
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_all, name: Skate.Supervisor]
    Supervisor.start_link(children, opts)
  end

  def runtime_config() do
    environment_variables = [
      gtfs_url: "SKATE_GTFS_URL",
      swiftly_authorization_key: "SWIFTLY_AUTHORIZATION_KEY",
      swiftly_realtime_vehicles_url: "SWIFTLY_REALTIME_VEHICLES_URL",
      secret: "SKATE_SECRET",
      signed_secret: "SKATE_SIGNED_SECRET"
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
  @spec config_change(any, any, any) :: :ok
  def config_change(changed, _new, removed) do
    SkateWeb.Endpoint.config_change(changed, removed)
    :ok
  end

  @spec get_config_string(atom) :: String.t() | nil
  def get_config_string(name) do
    case Application.get_env(:skate, name) do
      {:system, env_var} -> System.get_env(env_var)
      value -> value
    end
  end

  @spec update_static_url(list(tuple())) :: list(tuple())
  def update_static_url([{:static_url, static_url_parts} | rest]) do
    static_url_parts =
      Enum.map(static_url_parts, fn {key, value} -> {key, update_static_url_part(value)} end)

    [{:static_url, static_url_parts} | update_static_url(rest)]
  end

  def update_static_url([first | rest]) do
    [first | update_static_url(rest)]
  end

  def update_static_url([]) do
    []
  end

  defp update_static_url_part({:system, env_var}), do: System.get_env(env_var)
  defp update_static_url_part(value), do: value
end
