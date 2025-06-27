defmodule Skate.Detours.NotificationScheduler.Supervisor do
  @moduledoc false

  use Supervisor

  alias Skate.Detours.NotificationScheduler.{Server, Worker}

  def start_link([]) do
    Supervisor.start_link(__MODULE__, :ok)
  end

  @impl true
  def init(:ok) do
    children = [
      {Server, name: Server.default_name(), poll_ms: Server.poll_ms()},
      {Worker, name: Worker.default_name()}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end
end
