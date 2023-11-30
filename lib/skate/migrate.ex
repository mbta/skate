defmodule Skate.Migrate do
  @moduledoc """
  GenServer which runs on startup to run Ecto migrations. All migrations
  stored in the "migrations" directory are run during init. Migrations stored
  in the "async_migrations" directory will be run after the regular migrations
  complete and will only log a warning on failure.
  """
  use GenServer, restart: :transient
  require Logger

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts)
  end

  @impl GenServer
  def init(opts) do
    Logger.info("#{__MODULE__} synchronous migrations starting")
    Keyword.get(opts, :sync_migrate_fn, &default_migrate_fn/1).("migrations")

    Logger.info("#{__MODULE__} synchronous migrations finished")
    {:ok, opts, {:continue, :async_migrations}}
  end

  @impl GenServer
  def handle_continue(:async_migrations, opts) do
    Logger.info("#{__MODULE__} async migrations starting")

    try do
      Keyword.get(
        opts,
        :async_migrate_fn,
        &default_migrate_fn/1
      ).("async_migrations")

      Logger.info("#{__MODULE__} async migrations finished")
    rescue
      e ->
        Logger.warning("#{__MODULE__} async migrations failed. error=#{inspect(e)}")
        :ok
    end

    {:stop, :normal, opts}
  end

  defp default_migrate_fn(migration_directory) do
    Ecto.Migrator.run(
      Skate.Repo,
      Ecto.Migrator.migrations_path(Skate.Repo, migration_directory),
      :up,
      all: true
    )
  end
end
