defmodule Notifications.Supervisor do
  @moduledoc false

  use Supervisor

  def start_link([]) do
    Supervisor.start_link(__MODULE__, :ok)
  end

  @spec registry_name() :: Registry.registry()
  def registry_name() do
    Application.get_env(:notifications, :registry, Notifications.Registry)
  end

  @impl true
  def init(:ok) do
    children = [
      {Registry, keys: :duplicate, name: registry_name()},
      {Notifications.NotificationServer, name: Notifications.NotificationServer.default_name()},
      {Notifications.Bridge, name: Notifications.Bridge.default_name()}
    ]

    Supervisor.init(children, strategy: :one_for_all)
  end
end
