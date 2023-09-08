defmodule Skate.Oban.CleanUpNotifications do
  use Oban.Worker,
    queue: :default
    unique: [period: 300]

  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    :ok
  end
end
