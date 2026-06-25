defmodule Skate.Repo.Migrations.CreateDetourNotificationsReference do
  use Ecto.Migration

  # excellent_migrations:safety-assured-for-this-file column_reference_added

  def change do
    alter table(:notifications) do
      add(:detour_id, references(:detour_notifications))
    end
  end
end
