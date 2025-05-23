defmodule Skate.Repo.Migrations.AddDetourExpirationNotificationsTable do
  use Ecto.Migration

  def up do
    create table("detour_expiration_notifications") do
      add :expires_at, :utc_datetime_usec, null: false
      add :detour_id, references(:detours), null: false
      timestamps()
    end
  end

  def down do
    drop table("detour_expiration_notifications")
  end
end
