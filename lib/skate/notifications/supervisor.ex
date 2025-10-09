defmodule Skate.Notifications.Supervisor do
  @moduledoc false

  use Supervisor

  alias Skate.Notifications

  def start_link([]) do
    Supervisor.start_link(__MODULE__, :ok)
  end

  @impl true
  def init(:ok) do
    children = [
      {Phoenix.PubSub, name: Notifications.PubSub},
      {Notifications.NotificationServer,
       name: Notifications.NotificationServer.default_name(), pubsub_name: Notifications.PubSub},
      {Notifications.Bridge, name: Notifications.Bridge.default_name()}
    ]

    Supervisor.init(children, strategy: :one_for_all)
  end
end
