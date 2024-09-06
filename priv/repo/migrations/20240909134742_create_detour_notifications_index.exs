defmodule Skate.Repo.Migrations.CreateDetourNotificationsIndex do
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  def change do
    create index(:detour_notifications, [:detour_id], concurrently: true)
  end
end
