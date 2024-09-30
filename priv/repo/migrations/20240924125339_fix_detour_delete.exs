defmodule Skate.Repo.Migrations.FixDetourDelete do
  use Ecto.Migration

  # excellent_migrations:safety-assured-for-this-file column_reference_added
  # https://github.com/Artur-Sulej/excellent_migrations/blob/45c358d736ad51d9a32fba81f8d1373ff36043a6/README.md#adding-a-reference
  # https://github.com/fly-apps/safe-ecto-migrations/blob/bb21e2409a25a2a8c0cae2d6e8fed046eaa0928f/README.md#adding-a-reference-or-foreign-key

  def change do
    # If a detour is deleted, delete the associated detour notifications
    alter table(:detour_notifications) do
      modify :detour_id,
             references(
               :detours,
               on_delete: :delete_all,
               on_update: :update_all,
               validate: false
             ),
             from:
               references(
                 :posts,
                 on_delete: :nothing,
                 validate: false
               )
    end

    # If a detour notification is deleted, delete the associated notification
    alter table(:notifications) do
      modify :detour_id,
             references(
               :detour_notifications,
               on_delete: :delete_all,
               on_update: :update_all,
               validate: false
             ),
             from:
               references(
                 :detour_notifications,
                 validate: false
               )
    end
  end
end
