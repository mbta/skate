defmodule Skate.Repo.Migrations.CreateDetourStatusIndex do
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  def change do
    create index(:detours, [:status], concurrently: true)
  end
end
