defmodule Skate.Repo.Migrations.CreateDetourExpirationNotifications do
  use Ecto.Migration

  def change do
    create table(:detour_expiration_notification) do
      add :estimated_duration, :string, null: false
      add :expires_in, :duration, null: false

      add(
        :detour_id,
        references(:detours, on_delete: :delete_all, on_update: :update_all),
        null: false
      )
    end
  end
end
