defmodule Skate.Repo.Migrations.CreateDetoursIndex do
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  def change do
    create index(:detours, [:author_id], concurrently: true)
  end
end
