defmodule Skate.Repo.AsyncMigrations.FirstAsyncMigration do
  use Ecto.Migration
  require Logger

  def change do
    Logger.info("first async migration")

  end
end
