defmodule Skate.Repo.Migrations.FixDetourDeleteValidate do
  use Ecto.Migration
  # excellent_migrations:safety-assured-for-this-file raw_sql_executed
  # https://github.com/Artur-Sulej/excellent_migrations/blob/45c358d736ad51d9a32fba81f8d1373ff36043a6/README.md#adding-a-reference
  # https://github.com/fly-apps/safe-ecto-migrations/blob/bb21e2409a25a2a8c0cae2d6e8fed046eaa0928f/README.md#adding-a-reference-or-foreign-key
  # https://github.com/Artur-Sulej/excellent_migrations/blob/45c358d736ad51d9a32fba81f8d1373ff36043a6/README.md#executing-sql-directly

  def change do
    execute "ALTER TABLE detour_notifications VALIDATE CONSTRAINT detour_notifications_detour_id_fkey",
            ""

    execute "ALTER TABLE notifications VALIDATE CONSTRAINT notifications_detour_id_fkey", ""
  end
end
