defmodule Skate.Repo.Migrations.AddDetoursStatusRouteUpdatedAtIndexes do
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  def change do
    create index(:detours, [:status, :route_id, :updated_at], concurrently: true)
    create index(:detours, [:status, :updated_at], concurrently: true)
  end
end
