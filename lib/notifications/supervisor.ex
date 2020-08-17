defmodule Notifications.Supervisor do
  use Supervisor

  def start_link([]) do
    Supervisor.start_link(__MODULE__, :ok)
  end

  @spec registry_name() :: Registry.registry()
  def registry_name(), do: Notifications.Registry

  @impl true
  def init(:ok) do
    children = [
      {Registry, keys: :duplicate, name: registry_name()},
      {Notifications.NotificationServer, name: Notifications.NotificationServer.default_name()}
    ]

    Supervisor.init(children, strategy: :one_for_all)
  end
end
