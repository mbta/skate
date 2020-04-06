defmodule Static.Supervisor do
  use Supervisor

  def start_link([]) do
    Supervisor.start_link(__MODULE__, :ok)
  end

  @impl true
  def init(:ok) do
    children = [
      Static,
      Static.HealthServer
    ]

    Supervisor.init(children, strategy: :one_for_all)
  end
end
