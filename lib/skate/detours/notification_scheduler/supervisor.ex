defmodule Skate.Detors.NotificationScheduler.Supervisor do
  @moduledoc false

  use Supervisor

  def start_link([]) do
    Supervisor.start_link(__MODULE__, :ok)
  end

  @impl true
  def init(:ok) do
    children = [
      {Skate.Detours.NotificationScheduler.Server,
       name: Skate.Detours.NotificationScheduler.Server.default_name()},
      {Skate.Detours.NotificationScheduler.Worker,
       name: Skate.Detours.NotificationScheduler.Worker.default_name()}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end
end
