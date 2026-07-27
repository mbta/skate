defmodule Skate.AlertsManager.ActiveDetours.S3Exporter do
  use Oban.Worker

  @impl Oban.Worker
  def perform(%Oban.Job{} = _) do
    IO.puts "hello world!"
  end
end
