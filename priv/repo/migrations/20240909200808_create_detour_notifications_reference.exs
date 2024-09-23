defmodule Skate.Repo.Migrations.CreateDetourNotificationsReference do
  use Ecto.Migration

  def change do
    alter table(:notifications) do
      add(:detour_id, references(:detour_notifications))
    end
  end
end
