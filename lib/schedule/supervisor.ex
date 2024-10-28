defmodule Schedule.Supervisor do
  @moduledoc false

  use Supervisor

  def start_link([]) do
    Supervisor.start_link(__MODULE__, :ok)
  end

  @impl true
  def init(:ok) do
    children = [
      Schedule.Health.Server,
      Schedule.Fetcher
    ]

    Supervisor.init(children, strategy: :one_for_all)
  end
end
