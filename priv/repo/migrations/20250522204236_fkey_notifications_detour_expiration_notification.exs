defmodule Skate.Repo.Migrations.FkeyNotificationsDetourExpirationNotification do
  use Ecto.Migration

  # excellent_migrations:safety-assured-for-this-file column_reference_added

  def change do
    alter table(:notifications) do
      add(
        :detour_expiration_id,
        references(:detour_expiration_notification,
          on_delete: :delete_all,
          on_update: :update_all
        )
      )
    end
  end
end
